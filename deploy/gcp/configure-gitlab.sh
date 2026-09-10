#!/usr/bin/env bash
#
# Intellicore CMP — GitLab project configuration, via the REST API
#
# Does the three post-migration steps that MIGRATE_TO_GITLAB.md otherwise
# asks you to click through:
#
#   1. default branch  → main        (deploy:production only fires on main)
#   2. Auto DevOps     → off         (cannot work here: no container registry)
#   3. CI/CD variables → the six deploy:production needs
#
# RUN THIS FROM THE SEARCE VPN. gitlab.searce.com returns 403 to the public
# internet, so Cloud Shell and CI sandboxes cannot reach it.
#
# TOKEN SCOPE: this needs `api`, which is NOT the same as the
# `write_repository` token the migration used. write_repository can push code
# and nothing else; project settings are API calls. Create a second token (or
# one with both) at:
#   https://gitlab.searce.com/-/user_settings/personal_access_tokens
#
# Usage:
#   GITLAB_TOKEN=glpat-… bash deploy/gcp/configure-gitlab.sh
#
# Optional overrides (all default to the documented production values):
#   PROJECT_PATH=<group/project>   default intellicore-cmp/intellicore-cmp
#   GITLAB_HOST=<host>             default gitlab.searce.com
#   SA_KEY_FILE=<path>             GCP service account JSON for GCP_SA_KEY.
#                                  Searched for if unset; skipped if absent.
#   GCP_PROJECT_ID / VM_NAME / VM_ZONE / VM_USER / DOMAIN
#   STAGING_VM_NAME / STAGING_VM_ZONE / STAGING_DOMAIN  — set only if you have
#                                  a staging VM; skipped when unset.
#   PROTECT_MAIN=no                do NOT protect `main`; creates the variables
#                                  unprotected instead. See the note in step 3.
#   DRY_RUN=1                      show what would change, write nothing.
#
set -euo pipefail

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
bold() { printf "${BOLD}%s${NC}\n" "$*"; }
ok()   { printf "${GREEN}✔${NC}  %s\n" "$*"; }
warn() { printf "${YELLOW}⚠${NC}  %s\n" "$*"; }
fail() { printf "${RED}✘${NC}  %s\n" "$*"; exit 1; }

GITLAB_HOST="${GITLAB_HOST:-gitlab.searce.com}"
PROJECT_PATH="${PROJECT_PATH:-intellicore-cmp/intellicore-cmp}"
PROTECT_MAIN="${PROTECT_MAIN:-yes}"
DRY_RUN="${DRY_RUN:-}"

# Documented production values — MIGRATE_TO_GITLAB.md §3.
GCP_PROJECT_ID="${GCP_PROJECT_ID:-atre-practice-solutionplatform}"
VM_NAME="${VM_NAME:-intellicore-cmp-v1}"
VM_ZONE="${VM_ZONE:-asia-south1-a}"
VM_USER="${VM_USER:-nikhil_john_searce_com}"
DOMAIN="${DOMAIN:-35-200-215-108.sslip.io}"

# URL-encode the project path — the API addresses projects as group%2Fproject.
PROJECT_ID_ENC=$(printf '%s' "$PROJECT_PATH" | sed 's#/#%2F#g')
# API_BASE exists so the script can be exercised against a local stub; leave it
# unset for the real instance.
API="${API_BASE:-https://${GITLAB_HOST}/api/v4}"
PROJECT_API="${API}/projects/${PROJECT_ID_ENC}"

command -v curl >/dev/null || fail "curl not found"

bold "── Intellicore CMP · GitLab project configuration ───────────────────────"
echo "  Project: ${PROJECT_PATH}  on  ${GITLAB_HOST}"
[ -n "$DRY_RUN" ] && warn "DRY_RUN=1 — nothing will be written."
echo ""

# ── Credentials ──────────────────────────────────────────────────────────────

HAVE_TTY=no
if (exec 3</dev/tty) 2>/dev/null; then HAVE_TTY=yes; fi

if [ -z "${GITLAB_TOKEN:-}" ] && [ "$HAVE_TTY" = yes ]; then
  echo "  Needs a Personal Access Token with the 'api' scope — the migration's"
  echo "  write_repository token will NOT work for settings."
  echo "    https://${GITLAB_HOST}/-/user_settings/personal_access_tokens"
  echo ""
  for _attempt in 1 2 3; do
    printf "  Paste token (hidden): "
    IFS= read -rs GITLAB_TOKEN < /dev/tty || GITLAB_TOKEN=""
    echo ""
    GITLAB_TOKEN=$(printf '%s' "${GITLAB_TOKEN:-}" | tr -d '[:space:]')
    [ -n "$GITLAB_TOKEN" ] && break
    warn "Nothing read — if the prompt returned instantly, a newline from a"
    warn "pasted command was consumed. Paste the token on its own."
  done
  echo ""
fi

GITLAB_TOKEN=$(printf '%s' "${GITLAB_TOKEN:-}" | tr -d '[:space:]')
[ -n "$GITLAB_TOKEN" ] || fail "No token supplied.
        GITLAB_TOKEN=glpat-… bash deploy/gcp/configure-gitlab.sh"

case "$GITLAB_TOKEN" in
  glpat-*|glsoat-*) ;;
  glft-*) fail "That is a FEED token (RSS/calendar), not an access token. It
    authenticates nothing here. Use 'Add new token' on the access tokens page." ;;
  *) warn "Doesn't look like a personal access token (expected 'glpat-')." ;;
esac

# api() — $1 method, $2 url, remaining args passed to curl (e.g. --data-urlencode).
# Echoes the body, then a final line with the HTTP status.
api() {
  local method="$1" url="$2"; shift 2
  curl -sS -X "$method" -w '\n%{http_code}' --max-time 45 \
    -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" "$url" "$@" 2>/dev/null || printf '\n000'
}
body_of() { printf '%s' "$1" | sed '$d'; }
code_of() { printf '%s' "$1" | tail -n1; }
# Minimal JSON field read. No jq — macOS doesn't ship it, and adding a
# dependency to a script whose whole job is unblocking someone is a poor trade.
#
# The trailing `|| true` on both helpers is load-bearing under `set -o
# pipefail`: a grep that matches nothing fails the whole pipeline, which fails
# the command substitution, which under `set -e` exits the script. An absent
# field is a normal answer here — "no runners yet", "no pipeline yet" — so it
# has to read as empty, not as a fatal error.
json_field() { printf '%s' "$1" | tr ',' '\n' | grep -m1 "\"$2\":" | sed -E 's/.*"'"$2"'": *"?([^",}]*)"?.*/\1/' || true; }
# Counts matches, not matching lines — API responses arrive as one long line.
count_matches() { printf '%s' "$1" | grep -o "$2" | wc -l | tr -d ' ' || true; }

# ── Step 1 · Token and permissions ───────────────────────────────────────────

bold "── Step 1/5 · Token and permissions ─────────────────────────────────────"
R=$(api GET "${API}/user"); C=$(code_of "$R")
case "$C" in
  200) ok "Token valid — user '$(json_field "$(body_of "$R")" username)'" ;;
  401) fail "Token rejected for API calls (HTTP 401).

    If this token pushes code fine, it has write_repository but not 'api'.
    Those are separate scopes and scopes cannot be edited after creation —
    create a new token with 'api' at
      https://${GITLAB_HOST}/-/user_settings/personal_access_tokens" ;;
  403) fail "Token forbidden (HTTP 403) — missing the 'api' scope." ;;
  000) fail "No response from ${GITLAB_HOST}. On the Searce VPN?" ;;
  *)   fail "Unexpected HTTP ${C} from ${API}/user" ;;
esac

R=$(api GET "$PROJECT_API"); C=$(code_of "$R"); PROJ=$(body_of "$R")
case "$C" in
  200) ;;
  404) fail "Project '${PROJECT_PATH}' not found, or your token cannot see it." ;;
  *)   fail "Unexpected HTTP ${C} reading the project." ;;
esac

ACCESS=$(json_field "$PROJ" access_level)
CUR_DEFAULT=$(json_field "$PROJ" default_branch)
CUR_ADO=$(json_field "$PROJ" auto_devops_enabled)
echo "    default branch: ${CUR_DEFAULT:-?}    auto devops: ${CUR_ADO:-?}"
# 40 = Maintainer, 50 = Owner. Below that, settings writes will 403.
case "$ACCESS" in
  40|50) ok "Your access level on the project: ${ACCESS} (Maintainer or above)" ;;
  "")    warn "Could not read your access level — continuing; a 403 below means
    you are below Maintainer and need an Owner to do these three steps." ;;
  *)     warn "Your access level is ${ACCESS} — below Maintainer (40). The
    writes below will likely 403." ;;
esac
echo ""

# ── Step 2 · Default branch and Auto DevOps ──────────────────────────────────

bold "── Step 2/5 · Default branch and Auto DevOps ────────────────────────────"
if [ "$CUR_DEFAULT" = "main" ] && [ "$CUR_ADO" = "false" ]; then
  ok "Already set (default_branch=main, auto_devops_enabled=false)"
elif [ -n "$DRY_RUN" ]; then
  warn "would PUT default_branch=main auto_devops_enabled=false"
else
  R=$(api PUT "$PROJECT_API" \
        --data-urlencode "default_branch=main" \
        --data-urlencode "auto_devops_enabled=false")
  C=$(code_of "$R")
  case "$C" in
    200)
      ok "default_branch=main, auto_devops_enabled=false" ;;
    403)
      fail "HTTP 403 — your account cannot change project settings. Needs
    Maintainer or Owner on ${PROJECT_PATH}." ;;
    400)
      fail "HTTP 400 changing settings:
    $(body_of "$R")
    A 400 on default_branch usually means the branch doesn't exist on GitLab —
    run migrate-to-gitlab.sh with FORCE_MAIN=yes first." ;;
    *)
      fail "HTTP ${C} changing settings: $(body_of "$R")" ;;
  esac
fi
echo ""

# ── Step 3 · Branch protection, because it gates the variables ───────────────
# A *protected* CI variable is exposed only to pipelines on protected branches
# and tags. The runbook wants GCP_SA_KEY protected — that is the point of it:
# unprotected, the service account JSON is readable by a pipeline on any
# branch anyone can push. But protected variables on an UNPROTECTED main means
# deploy:production runs with them empty, which surfaces as a baffling gcloud
# auth failure rather than a permissions error. So the two settings have to be
# decided together, not one at a time.

bold "── Step 3/5 · Branch protection on 'main' ───────────────────────────────"
R=$(api GET "${PROJECT_API}/protected_branches/main"); C=$(code_of "$R")
MAIN_PROTECTED=no
[ "$C" = "200" ] && MAIN_PROTECTED=yes

if [ "$MAIN_PROTECTED" = yes ]; then
  ok "'main' is already protected — variables will be created protected."
  VAR_PROTECTED=true
elif [ "$PROTECT_MAIN" != yes ]; then
  VAR_PROTECTED=false
  warn "'main' is unprotected and PROTECT_MAIN=no, so the variables will be"
  warn "created UNPROTECTED. That works, with a cost: GCP_SA_KEY becomes"
  warn "readable by a pipeline on any branch. Fine for a private repo with a"
  warn "small team; not fine once outside contributors can push."
else
  echo "    'main' is not protected. Protecting it now, because the variables"
  echo "    below are meant to be protected and protected variables are"
  echo "    invisible to pipelines on unprotected branches — deploy:production"
  echo "    would run with an empty GCP_SA_KEY and fail at gcloud auth."
  echo "    Maintainers keep push access. Re-run with PROTECT_MAIN=no to skip"
  echo "    this and use unprotected variables instead."
  if [ -n "$DRY_RUN" ]; then
    warn "would POST protected_branches name=main (Maintainer push/merge)"
    VAR_PROTECTED=true
  else
    # 40 = Maintainer. Force push stays off — that's the default and we want it.
    R=$(api POST "${PROJECT_API}/protected_branches" \
          --data-urlencode "name=main" \
          --data-urlencode "push_access_level=40" \
          --data-urlencode "merge_access_level=40" \
          --data-urlencode "allow_force_push=false")
    C=$(code_of "$R")
    case "$C" in
      200|201) ok "'main' protected (Maintainers may push; force push off)"
               VAR_PROTECTED=true ;;
      409)     ok "'main' was already protected"
               VAR_PROTECTED=true ;;
      *)       warn "Could not protect 'main' (HTTP ${C}): $(body_of "$R")"
               warn "Falling back to UNPROTECTED variables so the deploy works."
               VAR_PROTECTED=false ;;
    esac
  fi
fi
echo ""

# ── Step 4 · CI/CD variables ─────────────────────────────────────────────────

bold "── Step 4/5 · CI/CD variables ───────────────────────────────────────────"

# Locate the service account JSON. It is generated by setup-searce-gcp.sh into
# whatever directory that ran in — often Cloud Shell, not this laptop — so
# absence is expected and must not abort the other five variables.
if [ -z "${SA_KEY_FILE:-}" ]; then
  for c in \
    ./intellicore-cicd-sa-key.json \
    "$HOME/intellicore-cicd-sa-key.json" \
    "$HOME/Downloads/intellicore-cicd-sa-key.json" \
    "$HOME/.config/gcloud/intellicore-cicd-sa-key.json"
  do
    [ -f "$c" ] && { SA_KEY_FILE="$c"; break; }
  done
fi

# upsert_var <key> <value-or-@file> <variable_type> <masked>
upsert_var() {
  local key="$1" val="$2" vtype="$3" masked="$4" data
  if [ "${val#@}" != "$val" ]; then
    data="value@${val#@}"          # curl reads the value from this file
  else
    data="value=${val}"
  fi

  if [ -n "$DRY_RUN" ]; then
    printf "    %-18s would set (%s, protected=%s, masked=%s)\n" \
      "$key" "$vtype" "$VAR_PROTECTED" "$masked"
    return 0
  fi

  local R C
  R=$(api POST "${PROJECT_API}/variables" \
        --data-urlencode "key=${key}" \
        --data-urlencode "$data" \
        --data-urlencode "variable_type=${vtype}" \
        --data-urlencode "protected=${VAR_PROTECTED}" \
        --data-urlencode "masked=${masked}")
  C=$(code_of "$R")

  # 400 + "already been taken" is the only expected non-success: update it.
  if [ "$C" = "400" ] && printf '%s' "$(body_of "$R")" | grep -q "already been taken"; then
    R=$(api PUT "${PROJECT_API}/variables/${key}" \
          --data-urlencode "$data" \
          --data-urlencode "variable_type=${vtype}" \
          --data-urlencode "protected=${VAR_PROTECTED}" \
          --data-urlencode "masked=${masked}")
    C=$(code_of "$R")
    case "$C" in
      200) printf "    %-18s updated\n" "$key"; return 0 ;;
    esac
  elif [ "$C" = "201" ]; then
    printf "    %-18s created\n" "$key"; return 0
  fi

  printf "    %-18s ${RED}FAILED${NC} (HTTP %s) %s\n" "$key" "$C" "$(body_of "$R")"
  VAR_FAILED=1
  return 0
}

VAR_FAILED=0
echo "    protected=${VAR_PROTECTED} for every variable below."
echo ""

# Masking is off throughout on purpose: GCP_SA_KEY is JSON and GitLab cannot
# mask it, and the other five are not secrets — a masked non-secret only makes
# job logs harder to read.
upsert_var GCP_PROJECT_ID "$GCP_PROJECT_ID" env_var false
upsert_var VM_NAME        "$VM_NAME"        env_var false
upsert_var VM_ZONE        "$VM_ZONE"        env_var false
upsert_var VM_USER        "$VM_USER"        env_var false
upsert_var DOMAIN         "$DOMAIN"         env_var false

if [ -n "${SA_KEY_FILE:-}" ] && [ -f "$SA_KEY_FILE" ]; then
  if grep -q '"type" *: *"service_account"' "$SA_KEY_FILE"; then
    upsert_var GCP_SA_KEY "@${SA_KEY_FILE}" file false
    echo "                       ↑ from ${SA_KEY_FILE}"
  else
    warn "${SA_KEY_FILE} is not a GCP service account key — skipping GCP_SA_KEY."
    SA_KEY_MISSING=1
  fi
else
  SA_KEY_MISSING=1
fi

# Staging is optional and there is no staging VM today.
for pair in "STAGING_VM_NAME:${STAGING_VM_NAME:-}" \
            "STAGING_VM_ZONE:${STAGING_VM_ZONE:-}" \
            "STAGING_DOMAIN:${STAGING_DOMAIN:-}"; do
  k="${pair%%:*}"; v="${pair#*:}"
  [ -n "$v" ] && upsert_var "$k" "$v" env_var false
done
echo ""

# ── Verify ───────────────────────────────────────────────────────────────────

if [ -z "$DRY_RUN" ]; then
  R=$(api GET "$PROJECT_API"); PROJ=$(body_of "$R")
  printf "  %-24s %s\n" "default_branch" "$(json_field "$PROJ" default_branch)"
  printf "  %-24s %s\n" "auto_devops_enabled" "$(json_field "$PROJ" auto_devops_enabled)"
  R=$(api GET "${PROJECT_API}/variables?per_page=100"); VARS=$(body_of "$R")
  printf "  %-24s " "variables present"
  for k in GCP_SA_KEY GCP_PROJECT_ID VM_NAME VM_ZONE VM_USER DOMAIN; do
    printf '%s' "$VARS" | grep -q "\"key\": *\"${k}\"" && printf "%s " "$k"
  done
  echo ""
fi
echo ""

# ── Step 5 · Can a pipeline actually run? ────────────────────────────────────
# Correct variables are necessary and not sufficient. With no runner available
# to the project, every job sits 'pending' indefinitely — and a pending job
# looks like a slow queue, not a misconfiguration, so it is worth naming.
# Read-only, so it runs even under DRY_RUN.

bold "── Step 5/5 · Pipeline readiness ────────────────────────────────────────"
R=$(api GET "${PROJECT_API}/runners?per_page=20"); C=$(code_of "$R"); RUNNERS=$(body_of "$R")
if [ "$C" != "200" ]; then
  warn "Could not list runners (HTTP ${C}) — check by hand at
    https://${GITLAB_HOST}/${PROJECT_PATH}/-/settings/ci_cd"
else
  RUNNER_COUNT=$(count_matches "$RUNNERS" '"id": *[0-9]*')
  ONLINE_COUNT=$(count_matches "$RUNNERS" '"status": *"online"')
  if [ "${RUNNER_COUNT:-0}" = "0" ]; then
    warn "NO runners available to this project. Pipelines will queue forever."
    echo ""
    echo "    Nothing in the pipeline config can fix this — a runner has to"
    echo "    exist. Two routes, in MIGRATE_TO_GITLAB.md §5:"
    echo "      * enable Searce's shared/instance runners for the project, if"
    echo "        this instance has them, or"
    echo "      * register a project runner somewhere with egress to Google"
    echo "        APIs (oauth2.googleapis.com, compute.googleapis.com) — a"
    echo "        runner that cannot reach them dies at gcloud auth."
    echo "      https://${GITLAB_HOST}/${PROJECT_PATH}/-/settings/ci_cd"
  elif [ "${ONLINE_COUNT:-0}" = "0" ]; then
    warn "${RUNNER_COUNT} runner(s) attached but NONE online — jobs will queue."
  else
    ok "${ONLINE_COUNT} of ${RUNNER_COUNT} runner(s) online"
  fi
fi

# The push that established `main` will already have started a pipeline, before
# any of these variables existed. Report it so a stale failure isn't mistaken
# for the current state.
R=$(api GET "${PROJECT_API}/pipelines?ref=main&per_page=1"); C=$(code_of "$R"); PIPE=$(body_of "$R")
if [ "$C" = "200" ]; then
  P_STATUS=$(json_field "$PIPE" status)
  if [ -z "$P_STATUS" ]; then
    echo "    No pipeline has run on 'main' yet."
  else
    echo "    Latest pipeline on 'main': ${P_STATUS}"
    echo "      $(json_field "$PIPE" web_url)"
    case "$P_STATUS" in
      failed)
        echo "    If that predates this run, it failed for want of the"
        echo "    variables just set — retry it rather than debugging it." ;;
    esac
  fi
fi

echo ""
bold "─────────────────────────────────────────────────────────────────────────"
if [ "${SA_KEY_MISSING:-0}" = "1" ]; then
  warn "GCP_SA_KEY was NOT set — no service account JSON found locally."
  echo ""
  echo "    It is generated by setup-searce-gcp.sh, which likely ran in Cloud"
  echo "    Shell rather than on this machine. Mint a fresh key (a service"
  echo "    account may hold several) and re-run just this script:"
  echo ""
  echo "        gcloud iam service-accounts keys create ~/intellicore-cicd-sa-key.json \\"
  echo "          --iam-account=intellicore-cicd@${GCP_PROJECT_ID}.iam.gserviceaccount.com \\"
  echo "          --project=${GCP_PROJECT_ID}"
  echo "        SA_KEY_FILE=~/intellicore-cicd-sa-key.json \\"
  echo "          GITLAB_TOKEN=… bash deploy/gcp/configure-gitlab.sh"
  echo ""
  echo "    Until then deploy:production will fail at gcloud auth. The other"
  echo "    five variables and both project settings are done."
else
  ok "All six variables set. deploy:production has what it needs."
fi

if [ "$VAR_FAILED" != "0" ]; then
  echo ""
  fail "Some variables failed — see above."
fi
