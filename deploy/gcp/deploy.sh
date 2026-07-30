#!/usr/bin/env bash
# ─── Intellicore CMP — one-shot GCP deployment ──────────────────────────
# Run from the repo root in Cloud Shell:   bash deploy/gcp/deploy.sh
#
# What it does:
#   1. Reserves a static IP → your URL becomes https://<ip>.sslip.io
#   2. Sets an admin email/password and generates all datastore secrets
#   3. Creates a Compute Engine VM with Docker, opens ports 80/443 only
#   4. Ships the code, builds, starts the stack
#   5. Seeds the Memory graph and provisions the admin login
#
# Auth today is an interim app-gate: email/password + TOTP (works with
# Google Authenticator, Authy, 1Password, etc). On first login the app
# shows a QR code to enroll; after that, sign-in prompts for a 6-digit
# code — that's your 2FA. "Remember this device" skips it for 30 days.
# Once this project moves under Searce's GCP org, swap in Google
# Workspace SSO per deploy/gcp/README.md — the app itself doesn't change.
set -euo pipefail

# ── Config (override via env before running) ────────────────────────────
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-asia-south1}"
ZONE="${ZONE:-asia-south1-a}"
VM_NAME="${VM_NAME:-intellicore-cmp-prod}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-standard-2}"
IP_NAME="${IP_NAME:-intellicore-cmp-ip}"
CURRENT_ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }

if [[ ! -f deploy/gcp/docker-compose.prod.yml ]]; then
  echo "ERROR: run this from the repo root:  bash deploy/gcp/deploy.sh" >&2
  exit 1
fi

bold "── Step 1/5 · Project & APIs ──────────────────────────────────────"
read -rp "GCP project ID [${PROJECT_ID}]: " P && PROJECT_ID="${P:-$PROJECT_ID}"
gcloud config set project "$PROJECT_ID" --quiet
gcloud services enable compute.googleapis.com --quiet

bold "── Step 2/5 · Static IP & URL ─────────────────────────────────────"
gcloud compute addresses create "$IP_NAME" --region "$REGION" --quiet 2>/dev/null || true
IP=$(gcloud compute addresses describe "$IP_NAME" --region "$REGION" --format='get(address)')
DOMAIN="${IP//./-}.sslip.io"
bold "  Your product URL will be:  https://${DOMAIN}"

bold "── Step 3/5 · Admin login & secrets ───────────────────────────────"
read -rp "  Admin email (this is who logs in) [${CURRENT_ACCOUNT}]: " ADMIN_EMAIL
ADMIN_EMAIL="${ADMIN_EMAIL:-$CURRENT_ACCOUNT}"
while true; do
  read -rsp "  Admin password: " ADMIN_PASSWORD; echo
  read -rsp "  Confirm password: " ADMIN_PASSWORD_CONFIRM; echo
  [[ "$ADMIN_PASSWORD" == "$ADMIN_PASSWORD_CONFIRM" && -n "$ADMIN_PASSWORD" ]] && break
  echo "  Passwords didn't match (or were empty) — try again."
done
read -rp "  Anthropic API key for Memory Chat (Enter to skip): " ANTHROPIC_API_KEY
DEFAULT_LE_EMAIL="${CURRENT_ACCOUNT:-admin@example.com}"
read -rp "  Let's Encrypt contact email [${DEFAULT_LE_EMAIL}]: " LE
LETSENCRYPT_EMAIL="${LE:-$DEFAULT_LE_EMAIL}"

cat > .env.prod <<EOF
DOMAIN=${DOMAIN}
LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}
POSTGRES_USER=intellicore
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=intellicore
NEO4J_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
CLAUDE_MODEL=claude-sonnet-4-5
TENANT_MODE=single
LOG_LEVEL=INFO
# Consumed once by scripts/create_admin.py at the end of this run — not
# read by any long-running service. Kept here only so the value survives
# the trip to the VM inside the same tarball as everything else.
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF
chmod 600 .env.prod
echo "  Wrote .env.prod (all datastore passwords freshly generated)."

bold "── Step 4/5 · VM + firewall + ship code ───────────────────────────"
gcloud compute firewall-rules create intellicore-allow-web \
  --allow=tcp:80,tcp:443 --target-tags=intellicore \
  --source-ranges=0.0.0.0/0 --quiet 2>/dev/null || true

gcloud compute instances create "$VM_NAME" \
  --zone "$ZONE" \
  --machine-type "$MACHINE_TYPE" \
  --image-family ubuntu-2204-lts --image-project ubuntu-os-cloud \
  --boot-disk-size 50GB --boot-disk-type pd-balanced \
  --tags intellicore \
  --address "$IP_NAME" \
  --metadata=startup-script='#!/bin/bash
set -e
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker' \
  --quiet 2>/dev/null || echo "  VM already exists — reusing it."

printf "  Waiting for Docker on the VM"
for i in $(seq 1 40); do
  if gcloud compute ssh "$VM_NAME" --zone "$ZONE" --tunnel-through-iap \
       --command "sudo docker version >/dev/null 2>&1" >/dev/null 2>&1 \
     || gcloud compute ssh "$VM_NAME" --zone "$ZONE" \
       --command "sudo docker version >/dev/null 2>&1" >/dev/null 2>&1; then
    echo " — ready."; break
  fi
  printf "."; sleep 10
  [[ $i -eq 40 ]] && { echo " timed out. Re-run the script."; exit 1; }
done

TARBALL=/tmp/intellicore-cmp.tar.gz
tar --exclude=node_modules --exclude=.next --exclude=__pycache__ \
    --exclude=.venv --exclude=.git -czf "$TARBALL" .
gcloud compute scp "$TARBALL" "$VM_NAME":/tmp/ --zone "$ZONE"
gcloud compute ssh "$VM_NAME" --zone "$ZONE" --command "
  set -e
  rm -rf ~/intellicore-cmp && mkdir -p ~/intellicore-cmp
  tar -xzf /tmp/intellicore-cmp.tar.gz -C ~/intellicore-cmp
  cd ~/intellicore-cmp
  sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml up -d --build
"

bold "── Step 5/5 · Seed Memory graph + provision admin login ──────────"
gcloud compute ssh "$VM_NAME" --zone "$ZONE" --command "
  set -e
  cd ~/intellicore-cmp
  echo 'Waiting for backend to become healthy...'
  for i in \$(seq 1 60); do
    s=\$(sudo docker inspect -f '{{.State.Health.Status}}' intellicore-backend 2>/dev/null || echo starting)
    [ \"\$s\" = healthy ] && break
    sleep 5
  done
  sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml exec -T backend python -m scripts.seed_demo
  set -a; source .env.prod; set +a
  sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml exec -T -e ADMIN_EMAIL -e ADMIN_PASSWORD backend python -m scripts.create_admin
"

bold "───────────────────────────────────────────────────────────────────"
bold "  ✔ Intellicore CMP is live:  https://${DOMAIN}"
echo "    Sign in with: ${ADMIN_EMAIL}"
echo "    First login shows a QR code — scan it with Google Authenticator"
echo "    (or Authy / 1Password) to finish setting up 2FA."
echo ""
echo "    Manage:  gcloud compute ssh ${VM_NAME} --zone ${ZONE}"
echo "    Logs:    sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml logs -f"
bold "───────────────────────────────────────────────────────────────────"
