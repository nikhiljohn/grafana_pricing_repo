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
#     empty project. See step 5.
#
# Usage:
#   bash deploy/gcp/migrate-to-gitlab.sh
#
# Optional:
#   GITLAB_URL=<url>       target (default: the intellicore-cmp project).
#                          An SSH URL (git@host:group/repo.git) skips all the
#                          token handling below.
#   GITLAB_TOKEN=<pat>     Personal Access Token, scope write_repository.
#                          Prompted for (hidden) if not set. An account
#                          password will NOT work on this instance.
#   GITLAB_USER=<name>     HTTP Basic username. Only needed for a project/group
#                          access token (username = the token's NAME) or a
#                          deploy token. A personal token uses `oauth2`.
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
command -v curl >/dev/null || fail "curl not found"

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

# Host, for probes and for the help links. Handles https://, ssh:// and the
# scp-style git@host:path form alike.
GITLAB_HOST=$(printf '%s' "$GITLAB_URL" | sed -E 's#^[a-zA-Z0-9+.-]+://##; s#^[^@/]*@##; s#[:/].*##')
[ -n "$GITLAB_HOST" ] || fail "Could not parse a host out of GITLAB_URL: $GITLAB_URL"
# host[:port] — keep the port for anything that builds a URL. GITLAB_HOST is
# the bare host, for the help links and the SSH form.
GITLAB_AUTHORITY=$(printf '%s' "$GITLAB_URL" | sed -E 's#^[a-zA-Z0-9+.-]+://##; s#^[^@/]*@##; s#/.*##')

IS_HTTPS=no
SCHEME=""
case "$GITLAB_URL" in
  https://*|http://*)
    IS_HTTPS=yes
    SCHEME="${GITLAB_URL%%://*}" ;;
esac

# ── Credentials ──────────────────────────────────────────────────────────────
# GitLab rejects account passwords for git over HTTPS ("you're required to use
# a token instead of a password"). Take the PAT once and embed it in the push
# URL, so the pushes below don't each prompt separately.

# `-e /dev/tty` is not enough: the device node exists in containers where
# opening it fails, and the failed redirect below would spray bash errors.
HAVE_TTY=no
if (exec 3</dev/tty) 2>/dev/null; then HAVE_TTY=yes; fi

if [ "$IS_HTTPS" = yes ] && [ -z "${GITLAB_TOKEN:-}" ] && [ "$HAVE_TTY" = yes ]; then
  echo "  A GitLab Personal Access Token is required (an account password"
  echo "  will NOT work). Create one at:"
  echo "    https://${GITLAB_HOST}/-/user_settings/personal_access_tokens"
  echo "  Scope: write_repository. Copy it immediately — shown once."
  echo ""
  # Pasting `git pull` and this command together leaves a stray newline in the
  # tty buffer, which `read` swallows as an empty token. That used to sail on
  # and fail later as "Access denied", so re-ask instead.
  for _attempt in 1 2 3; do
    printf "  Paste token (hidden): "
    IFS= read -rs GITLAB_TOKEN < /dev/tty || GITLAB_TOKEN=""
    echo ""
    GITLAB_TOKEN=$(printf '%s' "${GITLAB_TOKEN:-}" | tr -d '[:space:]')
    [ -n "$GITLAB_TOKEN" ] && break
    warn "Nothing read. If the prompt returned without you typing, a newline"
    warn "from a pasted command was consumed — paste the token on its own."
  done
  echo ""
fi

if [ "$IS_HTTPS" = yes ]; then
  # A copy/paste often carries a trailing space or newline. That makes an
  # otherwise-valid token fail with exactly the same "Access denied" as a wrong
  # one, so trim before use — then report the SHAPE only, never the value,
  # because a truncated paste is the other common cause.
  GITLAB_TOKEN=$(printf '%s' "${GITLAB_TOKEN:-}" | tr -d '[:space:]')
  [ -n "$GITLAB_TOKEN" ] || fail "No token supplied.

    This instance rejects account passwords over HTTPS, and without a token
    git would fall back to a credential helper — on macOS that silently
    replays whatever the keychain holds, including a stale bad credential.
    So: get a token, or switch to SSH.

        GITLAB_TOKEN=<your-token> bash deploy/gcp/migrate-to-gitlab.sh"

  echo "  Token: ${#GITLAB_TOKEN} chars, prefix '$(printf '%s' "$GITLAB_TOKEN" | cut -c1-6)…'"
  case "$GITLAB_TOKEN" in
    glpat-*) ;;
    glptt-*|gldt-*)
      warn "That is a project/group or deploy token, not a personal one."
      warn "Those authenticate with the token's NAME as the username — pass it:"
      warn "  GITLAB_USER=<token-name> GITLAB_TOKEN=… bash …" ;;
    *)
      warn "Doesn't look like a GitLab personal token (expected 'glpat-')."
      warn "Check you copied the token itself and not the token's name." ;;
  esac
  echo ""
fi

# ── Step 1 · Reachability ────────────────────────────────────────────────────

bold "── Step 1/6 · Reachability ──────────────────────────────────────────────"
if [ "$IS_HTTPS" != yes ]; then
  warn "Non-HTTP target — skipping the HTTP reachability and credential probes."
else
  # Capture, then default on failure. NOT `curl … || echo 000` — curl prints
  # its own "000" before exiting non-zero, so that appends and yields "000000".
  HTTP_CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
    "${SCHEME}://${GITLAB_AUTHORITY}/users/sign_in" 2>/dev/null) || HTTP_CODE=""
  case "$HTTP_CODE" in ''|000) HTTP_CODE="000" ;; esac

  case "$HTTP_CODE" in
    200|302)
      ok "${GITLAB_AUTHORITY} reachable (HTTP ${HTTP_CODE})" ;;
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
    "${GITLAB_URL%.git}.git/info/refs?service=git-receive-pack" 2>/dev/null) || REPO_PROBE=""
  case "$REPO_PROBE" in ''|000) REPO_PROBE="000" ;; esac
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

# ── Step 2 · Credential check ────────────────────────────────────────────────
# Do this BEFORE the 54 MB clone, and do it against the exact endpoint git
# itself hits — `info/refs?service=git-receive-pack` over HTTP Basic. That is
# what makes the diagnosis precise: `git-upload-pack` answering 200 while
# `git-receive-pack` answers 403 means the token authenticates fine and simply
# cannot push (read_repository scope, or a role below Developer), which is a
# completely different fix from a rejected token. The API (/api/v4/user) is no
# good for this — it needs `read_api`, so a correctly scoped write_repository
# token would fail it and send us chasing the wrong problem.

PUSH_USER="oauth2"
bold "── Step 2/6 · Credential check ──────────────────────────────────────────"
if [ "$IS_HTTPS" != yes ]; then
  ok "SSH target — auth is your ssh-agent's problem, not HTTP Basic's."
else
  probe() {  # $1 = basic-auth username, $2 = git service → echoes HTTP code
    local code
    code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 \
      -u "${1}:${GITLAB_TOKEN}" \
      "${GITLAB_URL%.git}.git/info/refs?service=${2}" 2>/dev/null) || code=""
    case "$code" in ''|000) code="000" ;; esac
    printf '%s' "$code"
  }

  # `oauth2` is GitLab's documented username for a personal token. A
  # project/group or deploy token needs its own name instead, hence GITLAB_USER.
  CANDIDATES=("oauth2")
  [ -n "${GITLAB_USER:-}" ] && CANDIDATES=("$GITLAB_USER" "oauth2")

  PUSH_USER=""
  READ_OK=""
  ANY_RESPONSE=""
  for u in "${CANDIDATES[@]}"; do
    W=$(probe "$u" git-receive-pack)
    R=$(probe "$u" git-upload-pack)
    printf "    username '%s' → read %s, write %s\n" "$u" "$R" "$W"
    case "${R}${W}" in *000*) ;; *) ANY_RESPONSE=yes ;; esac
    if [ "$W" = "200" ]; then PUSH_USER="$u"; break; fi
    [ "$R" = "200" ] && READ_OK="$u"
  done
  echo ""

  if [ -n "$PUSH_USER" ]; then
    ok "Token accepted for push (as '${PUSH_USER}')"
  elif [ -z "$ANY_RESPONSE" ]; then
    fail "No HTTP response from ${GITLAB_HOST} for the git endpoints.

    The credential was never judged — the request itself did not complete
    (timeout, TLS failure, or a proxy in the way). This says nothing about
    your token. Check the VPN, then re-run.

    Nothing was cloned or pushed."
  elif [ -n "$READ_OK" ]; then
    fail "Token authenticates but CANNOT PUSH.

    GitLab accepted the credential for reads and refused it for writes. So the
    token is valid and not expired — it is one of exactly two things:

      1. Scope. The token has read_repository but not write_repository.
         Tokens' scopes cannot be edited after creation: revoke it and
         create a new one with write_repository at
           https://${GITLAB_HOST}/-/user_settings/personal_access_tokens

      2. Role. Your account is below Developer on the project (Reporter and
         Guest cannot push). Ask a project Owner/Maintainer to raise it:
           https://${GITLAB_HOST}/intellicore-cmp/intellicore-cmp/-/project_members

    Nothing was cloned or pushed."
  else
    fail "Credential REJECTED by GitLab (read ${R}, write ${W}).

    The credential itself is not being accepted, so scope is not the issue
    yet. In order of likelihood:

      1. Truncated or mangled paste. A GitLab PAT is normally 26+ chars and
         starts 'glpat-'; this one is ${#GITLAB_TOKEN} chars, prefix '$(printf '%s' "$GITLAB_TOKEN" | cut -c1-6)…'.
         If that looks off, copy it again — select the whole field.
      2. Expired or revoked. Check the token's row at
           https://${GITLAB_HOST}/-/user_settings/personal_access_tokens
      3. Wrong token type. A project/group or deploy token authenticates with
         the token's NAME as the username, not 'oauth2':
           GITLAB_USER=<token-name> GITLAB_TOKEN=… bash deploy/gcp/migrate-to-gitlab.sh
      4. Token from a different GitLab (gitlab.com, not ${GITLAB_HOST}).

    Or sidestep HTTP Basic entirely — usually quicker than debugging scopes:
        ssh-keygen -t ed25519 -C \"$(whoami)\" -f ~/.ssh/id_ed25519 -N ''
        pbcopy < ~/.ssh/id_ed25519.pub
        # paste at https://${GITLAB_HOST}/-/user_settings/ssh_keys
        ssh -T git@${GITLAB_HOST}          # expect a welcome message
        GITLAB_URL=git@${GITLAB_HOST}:intellicore-cmp/intellicore-cmp.git \\
          bash deploy/gcp/migrate-to-gitlab.sh

    Nothing was cloned or pushed."
  fi
fi

# ── Step 3 · Mirror-clone the source ─────────────────────────────────────────

bold "── Step 3/6 · Mirror-clone from GitHub ──────────────────────────────────"
rm -rf "$WORKDIR"
mkdir -p "$(dirname "$WORKDIR")"
git clone --mirror "$GITHUB_URL" "$WORKDIR"
cd "$WORKDIR"

# Fail fast rather than dropping into an interactive prompt, and — scoped to
# the GitLab host only, so the GitHub clone above keeps its credentials — take
# any credential helper out of the loop. On macOS osxkeychain will happily
# replay a bad credential saved by an earlier attempt, which presents as an
# "Access denied" that no amount of fixing the token can shift.
export GIT_TERMINAL_PROMPT=0
if [ "$IS_HTTPS" = yes ]; then
  git config --local "credential.${SCHEME}://${GITLAB_AUTHORITY}.helper" ""
  # Insert the credential after the scheme, dropping any userinfo the caller's
  # URL already carried.
  TARGET_REST="${GITLAB_URL#*://}"
  case "${TARGET_REST%%/*}" in *@*) TARGET_REST="${TARGET_REST#*@}" ;; esac
  PUSH_URL="${SCHEME}://${PUSH_USER}:${GITLAB_TOKEN}@${TARGET_REST}"
else
  PUSH_URL="$GITLAB_URL"
fi

# NOT `mapfile` — that is bash 4+, and stock macOS ships bash 3.2.
BRANCHES=()
while IFS= read -r b; do BRANCHES+=("$b"); done \
  < <(git for-each-ref --format='%(refname:short)' refs/heads)
TAG_COUNT=$(git for-each-ref --format='%(refname)' refs/tags | wc -l | tr -d ' ')
ok "Cloned ${#BRANCHES[@]} branch(es), ${TAG_COUNT} tag(s)"
echo ""
git for-each-ref --format='    %(refname:short)  %(objectname:short)' refs/heads
echo ""

# ── Step 4 · Push the branches ───────────────────────────────────────────────

bold "── Step 4/6 · Push branches ─────────────────────────────────────────────"
git remote add gitlab "$PUSH_URL" 2>/dev/null || git remote set-url gitlab "$PUSH_URL"
PUSH_FAILED=0

if ! AUTH_OUT=$(git ls-remote gitlab 2>&1); then
  printf '%s\n' "$AUTH_OUT" | scrub | sed 's/^/      /'
  fail "git could not authenticate, even though the step 2 probe passed.

    That combination is odd — the probe used the same credential against the
    same endpoint. Most likely a credential helper is still intercepting.
    Check what git resolves for this host:

        git -C $WORKDIR config --get-all credential.${SCHEME}://${GITLAB_AUTHORITY}.helper
        git config --global --get-all credential.helper

    Nothing was pushed."
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

# ── Step 5 · Establish `main` ────────────────────────────────────────────────

bold "── Step 5/6 · Establish 'main' ──────────────────────────────────────────"
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
    warn "Remote 'main' is $(printf '%s' "$REMOTE_MAIN" | cut -c1-8) — GitLab's stub initial commit."
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

# ── Step 6 · Verify ──────────────────────────────────────────────────────────

bold "── Step 6/6 · Verify ────────────────────────────────────────────────────"
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
