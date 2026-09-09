#!/usr/bin/env bash
#
# Intellicore CMP — one-shot deploy from Google Cloud Shell
#
# Clears the "wrong compose file" blocker (no Caddy ⇒ nothing on :443) and
# ships the current branch to the GCP VM over an IAP tunnel.
#
# Run it FROM CLOUD SHELL (not from the VM, not from this repo on the VM):
#
#   bash deploy/gcp/cloudshell-deploy.sh
#
# Or without a local clone:
#
#   curl -fsSL https://raw.githubusercontent.com/nikhiljohn/grafana_pricing_repo/claude/intellicore-cmp-review-j4fbts/deploy/gcp/cloudshell-deploy.sh | bash
#
# Overrides:
#   BRANCH=<branch>     what to deploy (default: the review branch)
#   VM=<name> ZONE=<z> PROJECT=<id> VM_USER=<user>
#   REBUILD=no          skip --build (fast restart, no image rebuild)
#
set -euo pipefail

BRANCH="${BRANCH:-claude/intellicore-cmp-review-j4fbts}"
VM="${VM:-intellicore-cmp-v1}"
ZONE="${ZONE:-asia-south1-a}"
PROJECT="${PROJECT:-atre-practice-solutionplatform}"
VM_USER="${VM_USER:-nikhil_john_searce_com}"
REBUILD="${REBUILD:-yes}"

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
bold() { printf "${BOLD}%s${NC}\n" "$*"; }
ok()   { printf "${GREEN}✔${NC}  %s\n" "$*"; }
warn() { printf "${YELLOW}⚠${NC}  %s\n" "$*"; }
fail() { printf "${RED}✘${NC}  %s\n" "$*"; exit 1; }

bold "── Intellicore CMP · deploy ─────────────────────────────────────────────"
echo "  Branch:  $BRANCH"
echo "  VM:      $VM  ($ZONE)"
echo "  Project: $PROJECT"
echo ""

command -v gcloud >/dev/null || fail "gcloud not found — run this from Cloud Shell."

BUILD_FLAG="--build"
[[ "$REBUILD" == "no" ]] && BUILD_FLAG=""

# The remote script. Single-quoted heredoc: nothing below is expanded here,
# except the few values injected via the `export` preamble we prepend.
REMOTE=$(cat <<'REMOTE_EOF'
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { printf "${GREEN}✔${NC}  %s\n" "$*"; }
warn() { printf "${YELLOW}⚠${NC}  %s\n" "$*"; }
die()  { printf "${RED}✘${NC}  %s\n" "$*"; exit 1; }

cd ~/intellicore-cmp || die "~/intellicore-cmp not found on the VM."

# Docker group membership, so future sessions don't need sudo. Takes effect
# on the NEXT login; everything here uses sudo regardless.
sudo usermod -aG docker "$(whoami)" 2>/dev/null || true

# A failed first boot can leave root-owned files (classically neo4j/seed)
# that make `git reset --hard` fail. Reclaim them before touching git.
sudo chown -R "$(id -u):$(id -g)" ~/intellicore-cmp 2>/dev/null || true

echo "── 1/7 · Fetch $BRANCH ────────────────────────────────────────"
git fetch origin "$BRANCH"
# Discard any local edits first, or the checkout below can refuse to move.
git reset --hard HEAD 2>/dev/null || true
git checkout -B deploy-head "origin/$BRANCH"
ok "At $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s | cut -c1-60)"

echo "── 2/7 · Locate .env.prod ─────────────────────────────────────"
# update.sh and the CI pipeline both read .env.prod from the REPO ROOT.
# The setup script writes it to deploy/gcp/. Normalise once.
if [ -f deploy/gcp/.env.prod ] && [ ! -f .env.prod ]; then
  mv deploy/gcp/.env.prod .env.prod
  ok "Moved deploy/gcp/.env.prod → repo root"
fi
[ -f .env.prod ] || die ".env.prod not found (checked repo root and deploy/gcp/).
    It holds every secret and is gitignored, so it only exists on this VM.
    If it is genuinely gone, re-run deploy/gcp/setup-searce-gcp.sh."
chmod 600 .env.prod
ok ".env.prod present at repo root"

DOMAIN=$(grep -E '^DOMAIN=' .env.prod | head -1 | cut -d= -f2- | tr -d "\"' ")
[ -n "$DOMAIN" ] || warn "DOMAIN not set in .env.prod — Caddy cannot issue a certificate"
echo "    DOMAIN=$DOMAIN"

# THE fix: every compose command must name the prod file. Plain
# `docker compose` picks the root docker-compose.yml, which has no Caddy —
# so nothing binds :443 and the site is unreachable.
DC="sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml"

echo "── 3/7 · Tear down cleanly ────────────────────────────────────"
# Down BOTH compose files: the wrong one may be what's currently running.
# No -v anywhere — that would destroy the Postgres volume.
sudo docker compose --env-file .env.prod -f docker-compose.yml down --remove-orphans 2>/dev/null || true
$DC down --remove-orphans 2>/dev/null || true
# Stale fixed-name containers block recreate even after a partial down.
sudo docker rm -f intellicore-postgres intellicore-neo4j intellicore-redis \
  intellicore-backend intellicore-frontend intellicore-edge 2>/dev/null || true
ok "Old containers removed (volumes untouched)"

echo "── 4/7 · Build & start (this is the slow part) ─────────────────"
$DC up -d $BUILD_FLAG
ok "Stack started"

# The Caddyfile is a read-only BIND MOUNT, so editing it does not change the
# container spec and `up -d` will NOT recreate Caddy — it would keep serving
# the old config from memory. Reload explicitly. `caddy reload` is graceful:
# it keeps existing connections and the issued certificates.
if sudo docker ps --format '{{.Names}}' | grep -q '^intellicore-edge$'; then
  if $DC exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile 2>/dev/null; then
    ok "Caddyfile reloaded"
  else
    warn "caddy reload failed — restarting the container instead"
    $DC restart caddy
  fi
fi

echo "── 5/7 · Wait for health ──────────────────────────────────────"
for i in $(seq 1 24); do
  if sudo docker inspect -f '{{.State.Health.Status}}' intellicore-backend 2>/dev/null | grep -q healthy; then
    ok "Backend healthy"; break
  fi
  [ "$i" = "24" ] && warn "Backend health timed out — logs at step 7"
  printf "    waiting for backend (%d/24)...\r" "$i"
  sleep 5
done
echo ""

echo "── 6/7 · Provision admin ──────────────────────────────────────"
# ADMIN_EMAIL / ADMIN_PASSWORD come from .env.prod via the container env,
# so there is no password to retype. Also clears TOTP enrolment.
$DC exec -T backend python -m scripts.create_admin \
  || warn "create_admin failed — see backend logs below"

echo "── 7/7 · Verify ───────────────────────────────────────────────"
$DC ps
echo ""

if sudo docker ps --format '{{.Names}}' | grep -q '^intellicore-edge$'; then
  ok "intellicore-edge (Caddy) is running"
  sudo docker ps --filter name=intellicore-edge --format '    ports: {{.Ports}}'
else
  die "intellicore-edge is NOT running — that is the blocker. Caddy logs:
$($DC logs caddy --tail=40 2>&1 || echo '  (no caddy service — wrong compose file?)')"
fi

echo ""
echo "    Local origin checks (from inside the VM):"
curl -sf -o /dev/null -w "      frontend :3000 → %{http_code}\n" http://localhost:3000 || echo "      frontend :3000 → unreachable"
curl -sf -o /dev/null -w "      backend  :8000 → %{http_code}\n" http://localhost:8000/health || echo "      backend  :8000 → unreachable"

echo ""
echo "    Recent Caddy log (TLS issuance shows up here):"
$DC logs caddy --tail=15 2>&1 | sed 's/^/      /'

# Surface the classic post-.env.prod-regeneration failure explicitly.
if $DC logs backend --tail=40 2>&1 | grep -qi 'password authentication failed'; then
  echo ""
  warn "Postgres rejected the backend's password."
  echo "      The password is baked in at first init, so a regenerated"
  echo "      .env.prod won't match the existing volume. To reset (DESTROYS DB):"
  echo "        $DC down"
  echo "        sudo docker volume rm intellicore-cmp_postgres_data"
  echo "        $DC up -d"
fi

echo ""
ok "Deploy finished on the VM"
echo "    Open: https://${DOMAIN}"
REMOTE_EOF
)

bold "── Connecting over IAP ──────────────────────────────────────────────────"
gcloud compute ssh "${VM_USER}@${VM}" \
  --zone="$ZONE" \
  --tunnel-through-iap \
  --project="$PROJECT" \
  --ssh-flag="-o ServerAliveInterval=30" \
  --command="export BRANCH='${BRANCH}'; ${REMOTE}"

# ── Public reachability, from Cloud Shell ───────────────────────────────────
bold "── Public check ─────────────────────────────────────────────────────────"
DOMAIN_GUESS="${DOMAIN:-35-200-215-108.sslip.io}"
echo "  Giving Let's Encrypt a moment to finish the HTTP-01 challenge..."
sleep 20

CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "https://${DOMAIN_GUESS}/" 2>/dev/null || echo "000")
case "$CODE" in
  200|302|303)
    ok "https://${DOMAIN_GUESS}/ → HTTP ${CODE}"
    echo ""
    bold "  Site is up. Sign in with ADMIN_EMAIL / ADMIN_PASSWORD from .env.prod."
    echo "  First login prompts for a TOTP QR scan."
    ;;
  000)
    warn "No response from https://${DOMAIN_GUESS}/"
    echo "    Check the firewall allows :80 and :443 from 0.0.0.0/0 —"
    echo "    Let's Encrypt needs :80 reachable for the HTTP-01 challenge:"
    echo "      gcloud compute firewall-rules list --project=$PROJECT \\"
    echo "        --filter='allowed[].ports:(80 443)'"
    ;;
  525|526)
    warn "HTTP ${CODE} — TLS handshake failed. Certificate not issued yet."
    echo "    Watch issuance:  ...--command='cd ~/intellicore-cmp && sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml logs caddy -f'"
    ;;
  *)
    warn "https://${DOMAIN_GUESS}/ → HTTP ${CODE}"
    echo "    Caddy is answering but the app may not be. Check frontend/backend logs."
    ;;
esac
