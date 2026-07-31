#!/usr/bin/env bash
# ─── Intellicore CMP — provision a new customer environment on GCP ─────
#
# Stands up ONE isolated single-VM environment (staging OR production) for
# a customer: static IP + firewall + VM + Docker + the full stack behind
# Caddy auto-TLS, with strong generated secrets and a bootstrapped admin.
#
# Run it once per environment. Typical new-customer onboarding:
#   ENVIRONMENT=staging    ./deploy/gcp/provision-customer.sh
#   ENVIRONMENT=production ./deploy/gcp/provision-customer.sh
#
# Prereqs: run from the repo root in Cloud Shell (or any gcloud-authed
# shell) with git available. Requires: CUSTOMER, PROJECT, ADMIN_EMAIL.
#
# Config (env vars, with defaults):
#   CUSTOMER=acme                 # lowercase, no spaces  (REQUIRED)
#   PROJECT=my-gcp-project        # GCP project id        (REQUIRED)
#   ADMIN_EMAIL=admin@acme.com    # first admin user      (REQUIRED)
#   ENVIRONMENT=staging           # staging | production
#   REGION=asia-south1
#   MACHINE_TYPE=                 # default e2-standard-2 (staging) / e2-standard-4 (prod)
#   BRANCH=claude/intellicore-cmp-review-j4fbts
# ----------------------------------------------------------------------
set -euo pipefail

: "${CUSTOMER:?Set CUSTOMER=<name> (lowercase, no spaces)}"
: "${PROJECT:?Set PROJECT=<gcp-project-id>}"
: "${ADMIN_EMAIL:?Set ADMIN_EMAIL=<admin email>}"
ENVIRONMENT="${ENVIRONMENT:-staging}"
REGION="${REGION:-asia-south1}"
ZONE="${ZONE:-${REGION}-a}"
BRANCH="${BRANCH:-claude/intellicore-cmp-review-j4fbts}"
case "$ENVIRONMENT" in
  staging)    DEFAULT_MT=e2-standard-2 ;;
  production) DEFAULT_MT=e2-standard-4 ;;
  *) echo "ENVIRONMENT must be 'staging' or 'production'"; exit 1 ;;
esac
MACHINE_TYPE="${MACHINE_TYPE:-$DEFAULT_MT}"

NAME="intellicore-${CUSTOMER}-${ENVIRONMENT}"
IP_NAME="${NAME}-ip"
TAG="${NAME}"

echo "=== Provisioning ${NAME} (${MACHINE_TYPE}) in ${ZONE} / ${PROJECT} ==="
gcloud config set project "$PROJECT" >/dev/null
gcloud services enable compute.googleapis.com --quiet

# 1) Static IP + sslip.io domain
gcloud compute addresses create "$IP_NAME" --region "$REGION" --quiet 2>/dev/null || true
IP=$(gcloud compute addresses describe "$IP_NAME" --region "$REGION" --format='get(address)')
DOMAIN="${IP//./-}.sslip.io"
echo "IP: $IP   URL: https://$DOMAIN"

# 2) Firewall (80/443)
gcloud compute firewall-rules create "${NAME}-web" \
  --allow=tcp:80,tcp:443 --target-tags="$TAG" \
  --source-ranges=0.0.0.0/0 --quiet 2>/dev/null || true

# 3) VM with Docker
gcloud compute instances create "$NAME" \
  --zone "$ZONE" --machine-type "$MACHINE_TYPE" \
  --image-family ubuntu-2204-lts --image-project ubuntu-os-cloud \
  --boot-disk-size 50GB --boot-disk-type pd-balanced \
  --tags "$TAG" --address "$IP_NAME" \
  --metadata=startup-script='#!/bin/bash
set -e
if ! command -v docker >/dev/null; then curl -fsSL https://get.docker.com | sh; fi
systemctl enable --now docker' \
  --quiet 2>/dev/null || echo "VM exists, reusing"

# 4) Wait for Docker to be ready
echo "Waiting for Docker on the VM..."
for i in $(seq 1 30); do
  gcloud compute ssh "$NAME" --zone "$ZONE" --command "sudo docker version >/dev/null 2>&1" 2>/dev/null && break
  sleep 10
done

# 5) Package the repo (clean tracked files at HEAD) and ship it
git archive --format=tar.gz -o /tmp/intellicore-cmp.tgz HEAD
gcloud compute scp /tmp/intellicore-cmp.tgz "$NAME":/tmp/ --zone "$ZONE"

# 6) Generate secrets locally so we can print the admin password
PG_PW=$(openssl rand -hex 24)
NEO_PW=$(openssl rand -hex 24)
JWT=$(openssl rand -hex 32)
CRED=$(openssl rand -hex 32)
ADMIN_PW=$(openssl rand -base64 18)

# 7) Deploy on the VM
gcloud compute ssh "$NAME" --zone "$ZONE" --command "
  set -e
  rm -rf ~/intellicore-cmp && mkdir -p ~/intellicore-cmp
  tar -xzf /tmp/intellicore-cmp.tgz -C ~/intellicore-cmp
  cd ~/intellicore-cmp
  cat > .env.prod <<ENVEOF
DOMAIN=${DOMAIN}
LETSENCRYPT_EMAIL=${ADMIN_EMAIL}
POSTGRES_USER=intellicore
POSTGRES_PASSWORD=${PG_PW}
POSTGRES_DB=intellicore
NEO4J_PASSWORD=${NEO_PW}
JWT_SECRET=${JWT}
CREDENTIALS_SECRET=${CRED}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PW}
TENANT_MODE=single
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-5
LOG_LEVEL=INFO
ENVEOF
  chmod 600 .env.prod
  sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml up -d --build
  echo 'Waiting for services...'; sleep 30
  # bootstrap the first admin user
  sudo docker compose --env-file .env.prod -f deploy/gcp/docker-compose.prod.yml \
    exec -T -e ADMIN_EMAIL='${ADMIN_EMAIL}' -e ADMIN_PASSWORD='${ADMIN_PW}' \
    backend python -m scripts.create_admin || echo '(admin bootstrap: re-run if backend was still starting)'
  curl -sf http://localhost:3000       >/dev/null && echo 'Frontend: OK' || echo 'Frontend: starting'
  curl -sf http://localhost:8000/health >/dev/null && echo 'Backend: OK'  || echo 'Backend: starting'
"

echo
echo "=== ${NAME} provisioned ==="
echo "URL:            https://${DOMAIN}"
echo "Admin email:    ${ADMIN_EMAIL}"
echo "Admin password: ${ADMIN_PW}     (share securely; first login sets up TOTP)"
echo "VM:             ${NAME} in ${ZONE}"
echo "Note: TLS provisions on first HTTPS hit (Let's Encrypt via Caddy) — allow ~30s."
