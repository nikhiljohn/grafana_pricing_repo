#!/usr/bin/env bash
#
# Intellicore CMP — GitHub → Searce GitLab migration
#
# Copies every branch from the GitHub origin to Searce GitLab, then
# establishes `main` (the CI pipeline only deploys from `main`).
#
# RUN THIS FROM A MACHINE THAT CAN REACH gitlab.searce.com — in practice your
# laptop on the Searce VPN/corporate network. gitlab.searce.com sits behind a
# Google load balancer that returns 403 to the public internet, so Cloud Shell
# and CI sandboxes cannot do this.
#
# The target project already exists and is NOT empty: GitLab created it with an
# initial commit and a README on `main`. That matters —
#   * `git push --mirror` is unsafe here (it deletes remote refs absent
#     locally), so this script pushes named branches instead;
#   * our history is UNRELATED to that initial commit, so putting our tree on
#     `main` is a non-fast-forward and needs either a force push or a fresh
#     empty project. See step 4.
#
# Usage:
#   bash deploy/gcp/migrate-to-gitlab.sh
#
# Optional:
#   GITLAB_URL=<url>       target (default: the intellicore-cmp project)
#   MAIN_FROM=<branch>     branch to seed `main` from
#   FORCE_MAIN=yes         force-push `main` over the stub initial commit
#   CREATE_MAIN=no         skip establishing `main` entirely
#   GITHUB_URL=<url>       source (default: the GitHub origin)
#
set -euo pipefail

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
bold() { printf "${BOLD}%s${NC}\n" "$*"; }
ok()   { printf "${GREEN}✔${NC}  %s\n" "$*"; }
warn() { printf "${YELLOW}⚠${NC}  %s\n" "$*"; }
fail() { printf "${RED}✘${NC}  %s\n" "$*"; exit 1; }

GITHUB_URL="${GITHUB_URL:-https://github.com/nikhiljohn/grafana_pricing_repo.git}"
GITLAB_URL="${GITLAB_URL:-https://gitlab.searce.com/intellicore-cmp/intellicore-cmp.git}"
MAIN_FROM="${MAIN_FROM:-claude/intellicore-cmp-review-j4fbts}"
CREATE_MAIN="${CREATE_MAIN:-yes}"
FORCE_MAIN="${FORCE_MAIN:-no}"
WORKDIR="${WORKDIR:-/tmp/intellicore-migration}"

bold "── Intellicore CMP → Searce GitLab ──────────────────────────────────────"
echo "  Source: $GITHUB_URL"
echo "  Target: $GITLAB_URL"
echo ""

command -v git >/dev/null || fail "git not found"

# ── Step 1 · Reachability ────────────────────────────────────────────────────

bold "── Step 1/5 · Reachability ──────────────────────────────────────────────"
case "$GITLAB_URL" in
  http*) ;;
  *) warn "Non-HTTP target ($GITLAB_URL) — skipping the reachability probe."
     HTTP_CODE="skip" ;;
esac

if [ "${HTTP_CODE:-}" != "skip" ]; then
GITLAB_HOST=$(printf '%s' "$GITLAB_URL" | sed -E 's#^https?://([^/]+)/.*#\1#')
HTTP_CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
  "https://${GITLAB_HOST}/users/sign_in" 2>/dev/null || echo "000")

case "$HTTP_CODE" in
  200|302)
    ok "${GITLAB_HOST} reachable (HTTP ${HTTP_CODE})" ;;
  403)
    fail "${GITLAB_HOST} returned HTTP 403 — you are outside the Searce network
    perimeter. Connect to the Searce VPN / corporate network and re-run.
    (This is why the migration cannot run from Cloud Shell or a CI sandbox.)" ;;
  000)
    fail "Could not reach ${GITLAB_HOST} at all. Check DNS/VPN." ;;
  *)
    warn "${GITLAB_HOST} returned HTTP ${HTTP_CODE} — continuing, auth may fail" ;;
esac
fi

# ── Step 2 · Mirror-clone the source ─────────────────────────────────────────

bold "── Step 2/5 · Mirror-clone from GitHub ──────────────────────────────────"
rm -rf "$WORKDIR"
mkdir -p "$(dirname "$WORKDIR")"
git clone --mirror "$GITHUB_URL" "$WORKDIR"
cd "$WORKDIR"

# NOT `mapfile` — that is bash 4+, and stock macOS ships bash 3.2.
BRANCHES=()
while IFS= read -r b; do BRANCHES+=("$b"); done \
  < <(git for-each-ref --format='%(refname:short)' refs/heads)
TAG_COUNT=$(git for-each-ref --format='%(refname)' refs/tags | wc -l | tr -d ' ')
ok "Cloned ${#BRANCHES[@]} branch(es), ${TAG_COUNT} tag(s)"
echo ""
git for-each-ref --format='    %(refname:short)  %(objectname:short)' refs/heads
echo ""

# ── Step 3 · Push the branches ───────────────────────────────────────────────

bold "── Step 3/5 · Push branches ─────────────────────────────────────────────"
echo "  Credentials: you have no SSH key on your GitLab profile yet, so this"
echo "  uses HTTPS. When prompted for a password, paste a Personal Access"
echo "  Token — Edit profile → Access tokens, scope: write_repository."
echo "  (Or add an SSH key and re-run with an SSH GITLAB_URL.)"
echo ""

git remote add gitlab "$GITLAB_URL" 2>/dev/null || git remote set-url gitlab "$GITLAB_URL"

# Named pushes, NOT --mirror. --mirror deletes remote refs that are absent
# locally, which on a non-empty target is destructive for anything already
# there. These branches don't exist on GitLab yet, so each is a clean create.
for b in "${BRANCHES[@]}"; do
  printf "    %s ... " "$b"
  if git push -q gitlab "refs/heads/${b}:refs/heads/${b}" 2>/dev/null; then
    echo "pushed"
  else
    echo "FAILED"
    warn "Could not push ${b}. Re-run just that one to see the error:"
    echo "        cd $WORKDIR && git push gitlab ${b}"
  fi
done
if [ "$TAG_COUNT" != "0" ]; then
  git push -q --tags gitlab && ok "Tags pushed"
fi
ok "Branch push complete"

# ── Step 4 · Establish `main` ────────────────────────────────────────────────

bold "── Step 4/5 · Establish 'main' ──────────────────────────────────────────"
if [ "$CREATE_MAIN" != "yes" ]; then
  warn "Skipped (CREATE_MAIN=no). Note: deploy:production only fires on 'main'."
else
  git show-ref --verify --quiet "refs/heads/${MAIN_FROM}" \
    || fail "MAIN_FROM branch '${MAIN_FROM}' not found in the mirror"

  git fetch -q gitlab 'refs/heads/*:refs/remotes/gitlab/*' 2>/dev/null || true
  REMOTE_MAIN=$(git rev-parse --verify -q refs/remotes/gitlab/main || echo "")

  git branch -f main "refs/heads/${MAIN_FROM}"

  if [ -z "$REMOTE_MAIN" ]; then
    git push -q gitlab main && ok "Created 'main' from '${MAIN_FROM}'"
  elif git merge-base --is-ancestor "$REMOTE_MAIN" main 2>/dev/null; then
    git push -q gitlab main && ok "Fast-forwarded 'main' to '${MAIN_FROM}'"
  else
    warn "Remote 'main' is ${REMOTE_MAIN:0:8} — GitLab's stub initial commit."
    warn "Our history is unrelated to it, so this is a non-fast-forward."
    echo ""
    if [ "$FORCE_MAIN" = "yes" ]; then
      echo "    FORCE_MAIN=yes — force-pushing over the stub commit."
      if git push --force-with-lease gitlab main; then
        ok "'main' now points at '${MAIN_FROM}'"
      else
        echo ""
        fail "Force push to 'main' was REJECTED.
    Almost certainly GitLab's default branch protection. Two ways forward:

    A) Allow it once (fastest):
         Settings → Repository → Protected branches → main
         → 'Allowed to force push' = ON
       Re-run with FORCE_MAIN=yes, then turn it back OFF.

    B) Start from a truly empty project (cleanest):
         Delete this project, create a new blank one and UNCHECK
         'Initialize repository with a README', then re-run.
       Nothing is lost — that stub commit is only a placeholder README."
      fi
    else
      warn "Not forcing. The stub README commit would be discarded, so this"
      warn "needs an explicit opt-in. Re-run with:"
      echo ""
      echo "        FORCE_MAIN=yes bash deploy/gcp/migrate-to-gitlab.sh"
      echo ""
      echo "    If that is rejected by branch protection, either allow force"
      echo "    push on 'main' temporarily (Settings → Repository → Protected"
      echo "    branches), or recreate the project without a README."
      echo ""
      warn "Your branches ARE pushed — only 'main' is outstanding."
    fi
  fi
fi

# ── Step 5 · Verify ──────────────────────────────────────────────────────────

bold "── Step 5/5 · Verify ────────────────────────────────────────────────────"
git fetch -q gitlab 'refs/heads/*:refs/remotes/gitlab/*' 2>/dev/null || true

MISMATCH=0
printf "  %-46s %-10s %-10s\n" "BRANCH" "LOCAL" "GITLAB"
for b in "${BRANCHES[@]}"; do
  L=$(git rev-parse --short "refs/heads/${b}" 2>/dev/null || echo "-")
  R=$(git rev-parse --short "refs/remotes/gitlab/${b}" 2>/dev/null || echo "MISSING")
  printf "  %-46s %-10s %-10s\n" "$b" "$L" "$R"
  [ "$L" != "$R" ] && MISMATCH=1
done

echo ""
if [ "$MISMATCH" -eq 0 ]; then
  ok "Every branch matches on GitLab."
else
  warn "Some branches differ or are missing — see the table above."
fi

echo ""
bold "─────────────────────────────────────────────────────────────────────────"
echo "  Next, in GitLab:"
echo "    1. Settings → Repository → Branch defaults → main"
echo "    2. Settings → CI/CD → Variables — the 6 in MIGRATE_TO_GITLAB.md §3"
echo "    3. Settings → CI/CD → Auto DevOps — turn OFF. Our .gitlab-ci.yml"
echo "       takes precedence once pushed, but leaving Auto DevOps enabled is"
echo "       confusing, and it cannot work here anyway: the container registry"
echo "       is not enabled on this instance."
echo ""
echo "  Working copy left at: $WORKDIR (safe to delete)"
