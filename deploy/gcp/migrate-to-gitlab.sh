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
#   GITLAB_TOKEN=<pat>     Personal Access Token, scope write_repository.
#                          Prompted for (hidden) if not set. An account
#                          password will NOT work on this instance.
#
set -euo pipefail

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
bold() { printf "${BOLD}%s${NC}\n" "$*"; }
ok()   { printf "${GREEN}✔${NC}  %s\n" "$*"; }
warn() { printf "${YELLOW}⚠${NC}  %s\n" "$*"; }
fail() { printf "${RED}✘${NC}  %s\n" "$*"; exit 1; }
# git prints the remote URL in its errors. If a token is embedded there, that
# would leak it to the terminal and to any captured log. Redact userinfo.
scrub() { sed -E 's#(https?://)[^@/[:space:]]*@#\1***@#g'; }

GITHUB_URL="${GITHUB_URL:-https://github.com/nikhiljohn/grafana_pricing_repo.git}"
GITLAB_URL_FROM_ENV="${GITLAB_URL:+yes}"
GITLAB_URL="${GITLAB_URL:-https://gitlab.searce.com/intellicore-cmp/intellicore-cmp.git}"
MAIN_FROM="${MAIN_FROM:-claude/intellicore-cmp-review-j4fbts}"
CREATE_MAIN="${CREATE_MAIN:-yes}"
FORCE_MAIN="${FORCE_MAIN:-no}"
WORKDIR="${WORKDIR:-/tmp/intellicore-migration}"

bold "── Intellicore CMP → Searce GitLab ──────────────────────────────────────"
echo "  Source: $GITHUB_URL"
if [ -n "${GITLAB_URL_FROM_ENV:-}" ]; then
  echo "  Target: $GITLAB_URL   (from your GITLAB_URL env var)"
else
  echo "  Target: $GITLAB_URL   (script default)"
fi
echo ""

command -v git >/dev/null || fail "git not found"

# A GITLAB_URL exported with the docs' <group> placeholder still in it shadows
# the correct default above and makes every push fail with HTTP 400. Catch it
# here instead of three failed pushes later.
case "$GITLAB_URL" in
  *'<'*|*'>'*)
    fail "GITLAB_URL contains an unsubstituted placeholder:
      $GITLAB_URL
    Your shell has GITLAB_URL exported with '<group>' still in it. The
    script's own default is already correct, so just clear it:

        unset GITLAB_URL
        bash deploy/gcp/migrate-to-gitlab.sh" ;;
esac

# ── Credentials ──────────────────────────────────────────────────────────────
# GitLab rejects account passwords for git over HTTPS ("you're required to use
# a token instead of a password"). Take the PAT once and embed it in the push
# URL, so the four pushes below don't each prompt separately.

if [ -z "${GITLAB_TOKEN:-}" ] && [ -e /dev/tty ]; then
  case "$GITLAB_URL" in
    https://*)
      echo "  A GitLab Personal Access Token is required (an account password"
      echo "  will NOT work). Create one at:"
      echo "    ${GITLAB_URL%/*/*}/-/user_settings/personal_access_tokens"
      echo "  Scope: write_repository. Copy it immediately — shown once."
      echo ""
      printf "  Paste token (hidden, or press Enter to be prompted per-push): "
      IFS= read -rs GITLAB_TOKEN < /dev/tty || GITLAB_TOKEN=""
      echo ""
      echo "" ;;
  esac
fi

# oauth2:<token> is GitLab's documented HTTPS form for a PAT.
case "$GITLAB_URL" in
  https://*)
    if [ -n "${GITLAB_TOKEN:-}" ]; then
      PUSH_URL="https://oauth2:${GITLAB_TOKEN}@${GITLAB_URL#https://}"
      # Fail fast rather than falling back to interactive prompts.
      export GIT_TERMINAL_PROMPT=0
    else
      PUSH_URL="$GITLAB_URL"
    fi ;;
  *) PUSH_URL="$GITLAB_URL" ;;
esac

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

# The host being up says nothing about the project path existing. Probe the
# actual git endpoint: 401 is the healthy answer for a private repo (the path
# resolved, we just haven't authenticated yet).
REPO_PROBE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
  "${GITLAB_URL%.git}.git/info/refs?service=git-receive-pack" 2>/dev/null || echo "000")
case "$REPO_PROBE" in
  200|401)
    ok "Target project resolves (HTTP ${REPO_PROBE})" ;;
  404)
    fail "Target project NOT FOUND (HTTP 404):
      $GITLAB_URL
    Check the namespace/slug, or that your account can see it." ;;
  400)
    fail "Target URL rejected (HTTP 400):
      $GITLAB_URL
    That usually means a malformed path — e.g. a leftover placeholder." ;;
  *)
    warn "Target probe returned HTTP ${REPO_PROBE} — continuing" ;;
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
if [ -n "${GITLAB_TOKEN:-}" ]; then
  echo "  Using the Personal Access Token supplied above (one auth, not one"
  echo "  prompt per branch)."
else
  warn "No token supplied — git will prompt per push, and this instance"
  warn "rejects account passwords. Expect failures unless you have a"
  warn "credential helper already holding a valid token."
fi
echo ""

git remote add gitlab "$PUSH_URL" 2>/dev/null || git remote set-url gitlab "$PUSH_URL"
PUSH_FAILED=0

# Authenticate ONCE before pushing three branches. Previously a bad credential
# produced four separate prompts and four bare "FAILED" lines.
if ! AUTH_OUT=$(git ls-remote gitlab 2>&1); then
  printf '%s\n' "$AUTH_OUT" | scrub | sed 's/^/      /'
  fail "Authentication to GitLab FAILED — nothing was pushed.

    GitLab said your credential was rejected. Checklist:
      1. Use a Personal Access Token, NOT your account password.
         ${GITLAB_URL%/*/*}/-/user_settings/personal_access_tokens
      2. Scope must include write_repository (read_repository is not enough
         to push).
      3. Token must not be expired.
      4. If you typed a username/password at a prompt, that path is disabled
         on this instance — re-run and paste the token when asked.

    Re-run non-interactively once you have it:
        GITLAB_TOKEN=<your-token> bash deploy/gcp/migrate-to-gitlab.sh"
fi
ok "Authenticated to GitLab"

# Named pushes, NOT --mirror. --mirror deletes remote refs that are absent
# locally, which on a non-empty target is destructive for anything already
# there. These branches don't exist on GitLab yet, so each is a clean create.
for b in "${BRANCHES[@]}"; do
  printf "    %s ... " "$b"
  if PUSH_ERR=$(git push gitlab "refs/heads/${b}:refs/heads/${b}" 2>&1); then
    echo "pushed"
  else
    echo "FAILED"
    printf '%s\n' "$PUSH_ERR" | scrub | sed 's/^/        /'
    PUSH_FAILED=1
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
    if MAIN_ERR=$(git push gitlab main 2>&1); then
      ok "Created 'main' from '${MAIN_FROM}'"
    else
      printf '%s\n' "$MAIN_ERR" | scrub | sed 's/^/      /'; PUSH_FAILED=1
    fi
  elif git merge-base --is-ancestor "$REMOTE_MAIN" main 2>/dev/null; then
    if MAIN_ERR=$(git push gitlab main 2>&1); then
      ok "Fast-forwarded 'main' to '${MAIN_FROM}'"
    else
      printf '%s\n' "$MAIN_ERR" | scrub | sed 's/^/      /'; PUSH_FAILED=1
    fi
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

if [ "${PUSH_FAILED:-0}" != "0" ] || [ "$MISMATCH" -ne 0 ]; then
  echo ""
  fail "Migration did NOT fully succeed — see the errors above."
fi
