#!/usr/bin/env bash
# ─── Intellicore CMP — create the GitLab staging environment ───────────
#
# WHY THIS SCRIPT EXISTS
# gitlab.searce.com is reachable only from inside the Searce network
# perimeter — it returns 403 to the public internet, which includes Cloud
# Shell, CI sandboxes and Claude Code sessions. So the staging environment
# cannot be created from any of those. This script does the whole thing in
# one command from a machine on the VPN.
#
# WHAT IT DOES
#   1. Creates and pushes the `staging` branch on GitLab
#   2. Protects `staging` (maintainers push, no force-push)
#   3. Sets the staging CI/CD variables, including FreshService
#   4. Creates the GitLab "staging" environment
#   5. Reports whether a runner can actually pick up the pipeline
#
# It does NOT provision the GCP staging VM. That is
# provision-customer.sh with ENVIRONMENT=staging, and it needs gcloud
# rather than a GitLab token. See STAGING_RUNBOOK.md for the order.
#
# USAGE
#   GITLAB_TOKEN=glpat-… bash deploy/gcp/bootstrap-staging.sh
#   DRY_RUN=1 GITLAB_TOKEN=glpat-… bash deploy/gcp/bootstrap-staging.sh
#
# TOKEN SCOPE
#   `api` scope is required — `write_repository` pushes code and nothing
#   else, so it cannot set variables or protect branches. Scopes cannot be
#   edited after creation; mint a new token rather than trying to widen one.
#   A `glft-` value is the FEED token, printed on the same settings page,
#   and authenticates nothing. The prefix is the signal, not the length.
# ----------------------------------------------------------------------
set -euo pipefail

GITLAB_HOST="${GITLAB_HOST:-gitlab.searce.com}"
PROJECT_PATH="${PROJECT_PATH:-intellicore-cmp/intellicore-cmp}"
SOURCE_BRANCH="${SOURCE_BRANCH:-main}"
STAGING_BRANCH="${STAGING_BRANCH:-staging}"
DRY_RUN="${DRY_RUN:-0}"

# Strip a trailing newline — a pasted token with one fails identically to
# a wrong token, and the error message does not distinguish them.
GITLAB_TOKEN="$(printf '%s' "${GITLAB_TOKEN:-}" | tr -d '\r\n')"

API="https://${GITLAB_HOST}/api/v4"
PROJECT_ENC="$(printf '%s' "$PROJECT_PATH" | sed 's|/|%2F|g')"

log()  { printf '\033[0;36m▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[0;32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[0;33m!\033[0m %s\n' "$*"; }
die()  { printf '\033[0;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '\033[0;90m  [dry-run] %s\033[0m\n' "$*"
    return 0
  fi
  "$@"
}

# ── Preflight ────────────────────────────────────────────────────────

[[ -n "$GITLAB_TOKEN" ]] || die "GITLAB_TOKEN is not set."

case "$GITLAB_TOKEN" in
  glpat-*) ;;
  glft-*)  die "That is a FEED token (glft-), not an access token. A real PAT starts glpat-." ;;
  *)       warn "Token does not start with glpat- — continuing, but this is usually wrong." ;;
esac

command -v curl >/dev/null || die "curl is required."
command -v git  >/dev/null || die "git is required."

api() {
  local method="$1" path="$2"; shift 2
  curl -sS --fail-with-body -X "$method" \
    -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
    "${API}${path}" "$@"
}

log "Checking reachability…"
# The perimeter returns 403 to the public internet, and so does GitLab
# for an under-scoped token. Distinguish them BEFORE authenticating,
# using an unauthenticated probe: off-VPN this 403s with no token
# involved, which tells us the network is the problem, not the scope.
anon_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 \
  "https://${GITLAB_HOST}/users/sign_in" 2>/dev/null || echo "000")"
case "$anon_code" in
  200|302)
    ok "Inside the perimeter — ${GITLAB_HOST} is serving GitLab."
    ;;
  000)
    die "Cannot reach ${GITLAB_HOST} at all. Are you on the Searce VPN?"
    ;;
  403)
    die "${GITLAB_HOST} returned 403 to an UNAUTHENTICATED request — that is
   the network perimeter refusing you, not a token problem. Connect to the
   Searce VPN and re-run. No token change will fix this."
    ;;
  *)
    warn "Unexpected ${anon_code} from the sign-in page; continuing."
    ;;
esac

log "Checking token scope…"
http_code="$(curl -sS -o /dev/null -w '%{http_code}' \
  -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" "${API}/projects/${PROJECT_ENC}")"
case "$http_code" in
  200) ok "Token accepted, project visible." ;;
  401) die "Token rejected (401). Wrong or expired token." ;;
  403) die "Token lacks 'api' scope (403). write_repository is not enough, and scopes cannot be edited after creation — mint a new token." ;;
  404) die "Project ${PROJECT_PATH} not found, or the token cannot see it." ;;
  *)   die "Unexpected ${http_code} from the API." ;;
esac

# ── 1 · Branch ───────────────────────────────────────────────────────

log "Creating the ${STAGING_BRANCH} branch from ${SOURCE_BRANCH}…"
if api GET "/projects/${PROJECT_ENC}/repository/branches/${STAGING_BRANCH}" \
     >/dev/null 2>&1; then
  ok "${STAGING_BRANCH} already exists — leaving it alone."
else
  run api POST "/projects/${PROJECT_ENC}/repository/branches" \
    --data-urlencode "branch=${STAGING_BRANCH}" \
    --data-urlencode "ref=${SOURCE_BRANCH}" >/dev/null
  ok "Created ${STAGING_BRANCH}."
fi

# ── 2 · Protection ───────────────────────────────────────────────────
# Staging is protected because the CI/CD variables below are protected.
# A protected variable is invisible to a pipeline on an UNPROTECTED
# branch — so an unprotected staging branch means deploy:staging runs
# with an empty GCP_SA_KEY and dies at `gcloud auth`, looking exactly
# like a bad service account. This pairing is not optional.

log "Protecting ${STAGING_BRANCH}…"
api DELETE "/projects/${PROJECT_ENC}/protected_branches/${STAGING_BRANCH}" \
  >/dev/null 2>&1 || true
run api POST "/projects/${PROJECT_ENC}/protected_branches" \
  --data-urlencode "name=${STAGING_BRANCH}" \
  --data-urlencode "push_access_level=40" \
  --data-urlencode "merge_access_level=40" \
  --data-urlencode "allow_force_push=false" >/dev/null
ok "Protected (maintainers push, force-push off)."

# ── 3 · Environment ──────────────────────────────────────────────────

log "Creating the GitLab 'staging' environment…"
if api GET "/projects/${PROJECT_ENC}/environments?name=staging" 2>/dev/null \
     | grep -q '"name":"staging"'; then
  ok "Environment already exists."
else
  run api POST "/projects/${PROJECT_ENC}/environments" \
    --data-urlencode "name=staging" \
    --data-urlencode "external_url=https://${STAGING_DOMAIN:-staging.example.sslip.io}" \
    >/dev/null
  ok "Environment created."
fi

# ── 4 · CI/CD variables ──────────────────────────────────────────────
# Scoped to the staging environment so they cannot leak into production.

set_var() {
  local key="$1" value="$2" masked="${3:-true}"
  if [[ -z "$value" ]]; then
    warn "${key} is empty — skipping. Set it before the first staging deploy."
    return 0
  fi
  # Masking requires >=8 chars, base64 alphabet, no newlines. GitLab
  # rejects the whole request otherwise, so fall back rather than fail.
  if [[ ${#value} -lt 8 ]]; then masked=false; fi

  api DELETE "/projects/${PROJECT_ENC}/variables/${key}?filter[environment_scope]=staging" \
    >/dev/null 2>&1 || true
  run api POST "/projects/${PROJECT_ENC}/variables" \
    --data-urlencode "key=${key}" \
    --data-urlencode "value=${value}" \
    --data-urlencode "protected=true" \
    --data-urlencode "masked=${masked}" \
    --data-urlencode "environment_scope=staging" >/dev/null
  ok "Set ${key} (staging scope)."
}

log "Setting staging CI/CD variables…"
set_var STAGING_VM_NAME   "${STAGING_VM_NAME:-}"   false
set_var STAGING_VM_ZONE   "${STAGING_VM_ZONE:-}"   false
set_var STAGING_DOMAIN    "${STAGING_DOMAIN:-}"    false

# FreshService. The webhook secret is masked; the domain is not a secret.
set_var FRESHSERVICE_DOMAIN         "${FRESHSERVICE_DOMAIN:-}" false
set_var FRESHSERVICE_API_KEY        "${FRESHSERVICE_API_KEY:-}"
set_var FRESHSERVICE_WEBHOOK_SECRET "${FRESHSERVICE_WEBHOOK_SECRET:-}"

# ── 5 · Runner readiness ─────────────────────────────────────────────
# Read-only. A pipeline with no runner queues forever and reports nothing,
# so check before pushing and wondering why nothing happens.

log "Checking runner availability…"
runners="$(api GET "/projects/${PROJECT_ENC}/runners" 2>/dev/null || echo '[]')"
if [[ "$runners" == "[]" || -z "$runners" ]]; then
  warn "NO runners available to this project."
  warn "Pipelines will queue forever. A runner must:"
  warn "  1. run Docker images (node:20-alpine, python:3.11-slim, google/cloud-sdk:alpine)"
  warn "  2. reach oauth2.googleapis.com and compute.googleapis.com (for the IAP tunnel)"
  warn "  3. reach ${GITLAB_HOST} to pick up jobs at all"
  warn "Requirements 2 and 3 pull in opposite directions — the deploy VM"
  warn "sits OUTSIDE the Searce perimeter, so it cannot host the runner."
  warn "See deploy/gcp/MIGRATE_TO_GITLAB.md §5."
else
  ok "Runner(s) available."
fi

echo
ok "Staging bootstrap complete."
echo
echo "Next, in order:"
echo "  1. Provision the staging VM:"
echo "       ENVIRONMENT=staging CUSTOMER=shoppersstop \\"
echo "         PROJECT=<gcp-project> ADMIN_EMAIL=<you> \\"
echo "         bash deploy/gcp/provision-customer.sh"
echo "  2. Re-run this script with STAGING_VM_NAME / STAGING_VM_ZONE /"
echo "     STAGING_DOMAIN set, so the CI variables point at the new VM."
echo "  3. Push to the staging branch — deploy:staging fires automatically."
echo "  4. Configure the FreshService webhook to POST to"
echo "       https://\${STAGING_DOMAIN}/api/freshservice/webhook"
echo "     with header X-Intellicore-Signature: \${FRESHSERVICE_WEBHOOK_SECRET}"
