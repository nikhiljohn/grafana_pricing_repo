#!/usr/bin/env bash
#
# Intellicore CMP — GitHub → Searce GitLab migration
#
# Mirrors every branch, tag and commit from the GitHub origin to Searce GitLab,
# then optionally establishes `main` as the default branch (the CI pipeline
# only fires on `main`).
#
# RUN THIS FROM A MACHINE THAT CAN REACH gitlab.searce.com — that generally
# means your laptop on the Searce VPN/corporate network. gitlab.searce.com sits
# behind a Google load balancer that returns 403 to the public internet, so
# Cloud Shell may not be able to reach it.
#
# Usage:
#   export GITLAB_URL="https://gitlab.searce.com/<group>/intellicore-cmp.git"
#   bash deploy/gcp/migrate-to-gitlab.sh
#
# Optional:
#   MAIN_FROM=claude/intellicore-cmp-review-j4fbts   # branch to seed `main` from
#   CREATE_MAIN=yes                                  # set to `no` to skip
#   GITHUB_URL=https://github.com/nikhiljohn/grafana_pricing_repo.git
#
set -euo pipefail

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
bold() { printf "${BOLD}%s${NC}\n" "$*"; }
ok()   { printf "${GREEN}✔${NC}  %s\n" "$*"; }
warn() { printf "${YELLOW}⚠${NC}  %s\n" "$*"; }
fail() { printf "${RED}✘${NC}  %s\n" "$*"; exit 1; }

GITHUB_URL="${GITHUB_URL:-https://github.com/nikhiljohn/grafana_pricing_repo.git}"
GITLAB_URL="${GITLAB_URL:-}"
MAIN_FROM="${MAIN_FROM:-claude/intellicore-cmp-review-j4fbts}"
CREATE_MAIN="${CREATE_MAIN:-yes}"
WORKDIR="${WORKDIR:-/tmp/intellicore-migration}"

# ── Step 0 · Preflight ───────────────────────────────────────────────────────

bold "── Intellicore CMP → Searce GitLab ──────────────────────────────────────"

[[ -n "$GITLAB_URL" ]] || fail "GITLAB_URL is not set.
    export GITLAB_URL=\"https://gitlab.searce.com/<group>/intellicore-cmp.git\""

case "$GITLAB_URL" in
  *gitlab.searce.com*) ;;
  *) warn "GITLAB_URL does not look like a Searce GitLab URL: $GITLAB_URL" ;;
esac

command -v git >/dev/null || fail "git not found"

echo "  Source: $GITHUB_URL"
echo "  Target: $GITLAB_URL"
echo ""

bold "── Step 1/5 · Reachability ──────────────────────────────────────────────"
GITLAB_HOST=$(printf '%s' "$GITLAB_URL" | sed -E 's#^https?://([^/]+)/.*#\1#')
HTTP_CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
  "https://${GITLAB_HOST}/users/sign_in" 2>/dev/null || echo "000")

case "$HTTP_CODE" in
  200|302)
    ok "${GITLAB_HOST} reachable (HTTP ${HTTP_CODE})" ;;
  403)
    fail "${GITLAB_HOST} returned HTTP 403 — you are outside the Searce network perimeter.
    Connect to the Searce VPN / corporate network and re-run.
    (This is why the migration can't run from a cloud shell or CI sandbox.)" ;;
  000)
    fail "Could not reach ${GITLAB_HOST} at all. Check DNS/VPN." ;;
  *)
    warn "${GITLAB_HOST} returned HTTP ${HTTP_CODE} — continuing, but auth may fail" ;;
esac

# ── Step 2 · Bare mirror clone from GitHub ───────────────────────────────────

bold "── Step 2/5 · Mirror-clone from GitHub ──────────────────────────────────"
rm -rf "$WORKDIR"
mkdir -p "$(dirname "$WORKDIR")"
git clone --mirror "$GITHUB_URL" "$WORKDIR"
cd "$WORKDIR"

BRANCH_COUNT=$(git for-each-ref --format='%(refname)' refs/heads | wc -l | tr -d ' ')
TAG_COUNT=$(git for-each-ref --format='%(refname)' refs/tags | wc -l | tr -d ' ')
ok "Cloned ${BRANCH_COUNT} branch(es), ${TAG_COUNT} tag(s)"
echo ""
git for-each-ref --format='    %(refname:short)  %(objectname:short)' refs/heads
echo ""

# ── Step 3 · Push everything to GitLab ───────────────────────────────────────

bold "── Step 3/5 · Push to GitLab ────────────────────────────────────────────"
warn "The target project must already exist and be EMPTY."
warn "Create it first: GitLab → New project → Create blank project"
warn "               → UNCHECK 'Initialize repository with a README'."
echo ""
echo "  You will be prompted for credentials. Use a Personal Access Token"
echo "  (Preferences → Access Tokens, scope: write_repository) as the password."
echo ""

git remote add gitlab "$GITLAB_URL" 2>/dev/null || git remote set-url gitlab "$GITLAB_URL"

# --mirror pushes every ref under refs/ exactly as-is: all branches, all tags.
git push --mirror gitlab
ok "All refs pushed"

# ── Step 4 · Establish `main` ────────────────────────────────────────────────

bold "── Step 4/5 · Establish 'main' ──────────────────────────────────────────"
if [[ "$CREATE_MAIN" == "yes" ]]; then
  if git show-ref --verify --quiet "refs/heads/main"; then
    ok "'main' already exists — leaving it alone"
  elif git show-ref --verify --quiet "refs/heads/${MAIN_FROM}"; then
    git branch main "refs/heads/${MAIN_FROM}"
    git push gitlab main
    ok "Created 'main' from '${MAIN_FROM}' and pushed it"
    echo ""
    warn "Now set it as the default branch:"
    echo "    GitLab → Settings → Repository → Branch defaults → main"
    warn "The CI pipeline's deploy:production job ONLY fires on 'main'."
  else
    fail "MAIN_FROM branch '${MAIN_FROM}' not found in the mirror"
  fi
else
  warn "Skipped (CREATE_MAIN=no). Note: deploy:production only fires on 'main'."
fi

# ── Step 5 · Verify ──────────────────────────────────────────────────────────

bold "── Step 5/5 · Verify ────────────────────────────────────────────────────"
echo "  Local (from GitHub):"
git for-each-ref --format='    %(objectname) %(refname:short)' refs/heads | sort -k2

echo ""
echo "  Remote (GitLab):"
git ls-remote --heads gitlab | sed 's/refs\/heads\//    /' | awk '{print "    "$1" "$2}' | sort -k2

echo ""
MISSING=0
while read -r sha ref; do
  name="${ref#refs/heads/}"
  remote_sha=$(git ls-remote gitlab "refs/heads/${name}" | cut -f1)
  if [[ "$sha" != "$remote_sha" ]]; then
    warn "MISMATCH: ${name} local=${sha:0:8} remote=${remote_sha:0:8}"
    MISSING=1
  fi
done < <(git for-each-ref --format='%(objectname) %(refname)' refs/heads)

echo ""
if [[ "$MISSING" -eq 0 ]]; then
  bold "─────────────────────────────────────────────────────────────────────────"
  ok "Migration complete — every branch matches on GitLab."
  echo ""
  echo "  Next:"
  echo "    1. Set 'main' as the default branch (Settings → Repository)."
  echo "    2. Add the 6 CI/CD variables — see deploy/gcp/MIGRATE_TO_GITLAB.md §3."
  echo "    3. Push to 'main' to fire the first pipeline."
  echo ""
  echo "  Working tree left at: $WORKDIR (safe to delete)"
else
  fail "Some refs did not transfer. Re-run, or push them individually."
fi
