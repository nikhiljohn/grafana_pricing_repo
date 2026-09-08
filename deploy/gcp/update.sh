#!/usr/bin/env bash
# ─── Intellicore CMP — Incremental update script ──────────────────────────
# Runs on the GCP VM. Called by the GitLab CI/CD pipeline after a git pull,
# or manually for a quick redeploy without re-provisioning from scratch.
#
# Usage (on the VM):
#   cd ~/intellicore-cmp && bash deploy/gcp/update.sh
#
# What it does:
#   1. Validates .env.prod exists (does NOT regenerate secrets)
#   2. Rebuilds only the images that changed (Docker layer cache)
#   3. Performs a rolling restart (no downtime window needed for most changes)
#   4. Runs a health check and prints the result
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE="sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

bold()    { printf "${BOLD}%s${NC}\n" "$*"; }
ok()      { printf "${GREEN}✔${NC}  %s\n" "$*"; }
warn()    { printf "${YELLOW}⚠${NC}  %s\n" "$*"; }
fail()    { printf "${RED}✘${NC}  %s\n" "$*"; exit 1; }

# ── Preflight ────────────────────────────────────────────────────────────────

cd "$(dirname "$0")/../.."   # repo root regardless of where the script is called from

if [[ ! -f .env.prod ]]; then
  fail ".env.prod not found. Run deploy/gcp/deploy.sh first to provision the instance."
fi

bold "── Intellicore CMP — Update ─────────────────────────────────────────────"
echo "  Repo: $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo "  Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# ── Step 1 · Build changed images ────────────────────────────────────────────

bold "── Step 1/3 · Build ─────────────────────────────────────────────────────"
$COMPOSE build --parallel
ok "Images built"

# ── Step 2 · Rolling restart ─────────────────────────────────────────────────

bold "── Step 2/3 · Rolling restart ───────────────────────────────────────────"

# Restart services in dependency order so Caddy stays up the whole time.
# Caddy is restarted last — the app is accessible throughout.
for SERVICE in postgres neo4j redis backend frontend caddy; do
  # Only restart if the service is defined in this compose file
  if $COMPOSE ps --services 2>/dev/null | grep -q "^${SERVICE}$"; then
    $COMPOSE up -d --no-deps "$SERVICE"
    ok "  $SERVICE restarted"
  fi
done

# ── Step 3 · Health check ─────────────────────────────────────────────────────

bold "── Step 3/3 · Health check ──────────────────────────────────────────────"

# Wait up to 60s for the backend to become healthy
BACKEND_OK=false
for i in $(seq 1 12); do
  STATUS=$(sudo docker inspect -f '{{.State.Health.Status}}' intellicore-backend 2>/dev/null || echo "not_found")
  if [[ "$STATUS" == "healthy" ]]; then
    BACKEND_OK=true; break
  fi
  printf "  Waiting for backend (%d/12)...\r" "$i"
  sleep 5
done
echo ""

if $BACKEND_OK; then
  ok "Backend healthy"
else
  warn "Backend health check timed out — check logs:"
  echo "     sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml logs backend --tail=50"
fi

# Frontend: just check the container is running (no health check endpoint by default)
FRONTEND_STATUS=$(sudo docker inspect -f '{{.State.Status}}' intellicore-frontend 2>/dev/null || echo "not_found")
if [[ "$FRONTEND_STATUS" == "running" ]]; then
  ok "Frontend running"
else
  warn "Frontend container status: $FRONTEND_STATUS"
fi

# Derive domain from .env.prod for the final URL
DOMAIN=$(grep -E '^DOMAIN=' .env.prod | cut -d= -f2 | tr -d '"' | tr -d "'")

echo ""
bold "───────────────────────────────────────────────────────────────────────────"
if $BACKEND_OK; then
  ok "Intellicore CMP updated and healthy"
  echo "  🌐  https://${DOMAIN:-<see .env.prod for DOMAIN>}"
else
  warn "Update complete — backend health check timed out (the app may still be starting)"
  echo "  🌐  https://${DOMAIN:-<see .env.prod for DOMAIN>}"
fi
bold "───────────────────────────────────────────────────────────────────────────"
