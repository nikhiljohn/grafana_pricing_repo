#!/usr/bin/env bash
# ─── Intellicore CMP — Searce GCP Environment Setup ──────────────────────
# One-shot terminal script that configures everything on Searce's GCP org:
#
#   1. GCP project (create or reuse an existing Searce project)
#   2. Enable all required APIs
#   3. VM (create or migrate the existing instance)
#   4. IAP (Identity-Aware Proxy) — secure SSH without exposing port 22
#   5. Service account for GitLab CI/CD (IAP tunnel, no SSH key needed)
#   6. Cloud DNS — A record under a Searce-managed domain
#   7. Google Workspace SSO — creates the OAuth 2.0 client and prints
#      the values you paste into .env.prod and GitLab CI/CD variables
#
# Prerequisites:
#   • gcloud CLI authenticated as your @searce.com account
#       gcloud auth login --update-adc
#   • You have at least Project Creator rights in the Searce org
#   • Run from the repo root: bash deploy/gcp/setup-searce-gcp.sh
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
bold()  { printf "${BOLD}%s${NC}\n" "$*"; }
ok()    { printf "${GREEN}✔${NC}  %s\n" "$*"; }
warn()  { printf "${YELLOW}⚠${NC}  %s\n" "$*"; }
info()  { printf "${CYAN}ℹ${NC}  %s\n" "$*"; }
die()   { printf "${RED}✘${NC}  %s\n" "$*" >&2; exit 1; }
ask()   { printf "${BOLD}?${NC}  %s " "$*"; }

[[ ! -f deploy/gcp/docker-compose.prod.yml ]] && die "Run from the repo root: bash deploy/gcp/setup-searce-gcp.sh"

# ── 0. Auth check ─────────────────────────────────────────────────────────
CURRENT_ACCOUNT=$(gcloud config get-value account 2>/dev/null || true)
[[ -z "$CURRENT_ACCOUNT" ]] && die "Not logged in. Run: gcloud auth login --update-adc"
info "Authenticated as: ${CURRENT_ACCOUNT}"
echo ""

# ── 1. Organisation & project ─────────────────────────────────────────────
bold "── Step 1/7 · GCP Project ───────────────────────────────────────────────"

# Try to auto-detect the Searce org
SEARCE_ORG=$(gcloud organizations list --format="value(name)" 2>/dev/null \
  | grep -v "^$" | head -1 | sed 's/organizations\///' || true)

ask "Searce GCP Organization ID [${SEARCE_ORG:-press Enter to skip}]:"; read -r ORG_INPUT
ORG_ID="${ORG_INPUT:-$SEARCE_ORG}"

ask "GCP Project ID for Intellicore CMP [intellicore-cmp-prod]:"; read -r P
PROJECT_ID="${P:-intellicore-cmp-prod}"

# Create project if it doesn't exist
if gcloud projects describe "$PROJECT_ID" --quiet 2>/dev/null; then
  ok "Project $PROJECT_ID already exists — reusing"
else
  CREATE_CMD=(gcloud projects create "$PROJECT_ID" --name="Intellicore CMP")
  [[ -n "$ORG_ID" ]] && CREATE_CMD+=(--organization="$ORG_ID")
  "${CREATE_CMD[@]}" --quiet
  ok "Created project: $PROJECT_ID"
fi

gcloud config set project "$PROJECT_ID" --quiet

# Billing
BILLING_ACCOUNTS=$(gcloud billing accounts list --format="value(name)" 2>/dev/null | head -5 || true)
if [[ -n "$BILLING_ACCOUNTS" ]]; then
  echo ""
  info "Available billing accounts:"
  gcloud billing accounts list --format="table(name,displayName,open)" 2>/dev/null || true
  echo ""
  ask "Billing account ID to link [leave blank to skip]:"; read -r BILLING_ACCT
  if [[ -n "$BILLING_ACCT" ]]; then
    gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCT" --quiet
    ok "Billing linked: $BILLING_ACCT"
  else
    warn "Billing not linked — set it up in the Console if needed"
  fi
fi

# ── 2. Enable APIs ────────────────────────────────────────────────────────
bold ""
bold "── Step 2/7 · Enable APIs ───────────────────────────────────────────────"
gcloud services enable \
  compute.googleapis.com \
  iap.googleapis.com \
  dns.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  oslogin.googleapis.com \
  --project="$PROJECT_ID" --quiet
ok "All required APIs enabled"

# ── 3. VM — create or reuse ───────────────────────────────────────────────
bold ""
bold "── Step 3/7 · Compute VM ────────────────────────────────────────────────"

REGION="${REGION:-asia-south1}"
ZONE="${ZONE:-asia-south1-a}"
VM_NAME="${VM_NAME:-intellicore-cmp-prod}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-standard-2}"
IP_NAME="${IP_NAME:-intellicore-cmp-ip}"

ask "VM name [${VM_NAME}]:"; read -r V; VM_NAME="${V:-$VM_NAME}"
ask "Zone [${ZONE}]:"; read -r Z; ZONE="${Z:-$ZONE}"; REGION="${ZONE%-*}"

# Reserve static IP
if gcloud compute addresses describe "$IP_NAME" --region "$REGION" --project "$PROJECT_ID" --quiet 2>/dev/null; then
  ok "Static IP '$IP_NAME' already reserved"
else
  gcloud compute addresses create "$IP_NAME" --region "$REGION" --project "$PROJECT_ID" --quiet
  ok "Reserved static IP: $IP_NAME"
fi
VM_IP=$(gcloud compute addresses describe "$IP_NAME" --region "$REGION" --project "$PROJECT_ID" --format='get(address)')
info "IP address: $VM_IP"

# Firewall: allow HTTP/HTTPS, remove open SSH if present
gcloud compute firewall-rules create intellicore-allow-web \
  --allow=tcp:80,tcp:443 --target-tags=intellicore \
  --source-ranges=0.0.0.0/0 --project="$PROJECT_ID" --quiet 2>/dev/null || true

# Remove direct port-22 rule if it exists (IAP handles SSH)
gcloud compute firewall-rules delete intellicore-allow-ssh-cicd \
  --project="$PROJECT_ID" --quiet 2>/dev/null && \
  ok "Removed open SSH firewall rule (IAP is the new path)" || true

# Allow IAP SSH (required for gcloud compute ssh --tunnel-through-iap)
gcloud compute firewall-rules create intellicore-allow-iap-ssh \
  --allow=tcp:22 --target-tags=intellicore \
  --source-ranges=35.235.240.0/20 \
  --description="Allow SSH from Google IAP range only" \
  --project="$PROJECT_ID" --quiet 2>/dev/null || \
  ok "IAP SSH firewall rule already exists"

if gcloud compute instances describe "$VM_NAME" --zone "$ZONE" --project "$PROJECT_ID" --quiet 2>/dev/null; then
  ok "VM '$VM_NAME' already exists — updating tags if needed"
  gcloud compute instances add-tags "$VM_NAME" --tags=intellicore --zone "$ZONE" --project "$PROJECT_ID" --quiet 2>/dev/null || true
  # Update VM to use the static IP
  gcloud compute instances delete-access-config "$VM_NAME" --access-config-name="External NAT" \
    --zone "$ZONE" --project "$PROJECT_ID" --quiet 2>/dev/null || true
  gcloud compute instances add-access-config "$VM_NAME" \
    --access-config-name="External NAT" --address="$IP_NAME" \
    --zone "$ZONE" --project "$PROJECT_ID" --quiet 2>/dev/null || true
else
  info "Creating VM $VM_NAME..."
  gcloud compute instances create "$VM_NAME" \
    --zone "$ZONE" --project "$PROJECT_ID" \
    --machine-type "$MACHINE_TYPE" \
    --image-family ubuntu-2204-lts --image-project ubuntu-os-cloud \
    --boot-disk-size 50GB --boot-disk-type pd-balanced \
    --tags intellicore \
    --address "$IP_NAME" \
    --scopes=cloud-platform \
    --metadata=startup-script='#!/bin/bash
set -e
if ! command -v docker >/dev/null; then curl -fsSL https://get.docker.com | sh; fi
systemctl enable --now docker
apt-get install -y google-cloud-sdk-gce-go-runtime 2>/dev/null || true' \
    --quiet
  ok "VM created: $VM_NAME"
fi

# ── 4. IAP — enable for SSH ───────────────────────────────────────────────
bold ""
bold "── Step 4/7 · Identity-Aware Proxy (IAP) ────────────────────────────────"

# Grant IAP SSH access to the current user (allows gcloud compute ssh)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="user:${CURRENT_ACCOUNT}" \
  --role="roles/iap.tunnelResourceAccessor" \
  --quiet 2>/dev/null
ok "Granted IAP tunnel access to $CURRENT_ACCOUNT"

# ── 5. Service account for GitLab CI/CD ──────────────────────────────────
bold ""
bold "── Step 5/7 · CI/CD Service Account ─────────────────────────────────────"

CICD_SA="intellicore-cicd@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "$CICD_SA" --project "$PROJECT_ID" --quiet 2>/dev/null; then
  ok "Service account $CICD_SA already exists"
else
  gcloud iam service-accounts create intellicore-cicd \
    --display-name="Intellicore CMP GitLab CI/CD" \
    --project="$PROJECT_ID" --quiet
  ok "Created service account: $CICD_SA"
fi

# Grant roles: IAP tunnel + compute viewer (for gcloud compute ssh)
for ROLE in roles/iap.tunnelResourceAccessor roles/compute.viewer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CICD_SA}" \
    --role="$ROLE" --quiet 2>/dev/null
done
ok "Granted IAP + Compute Viewer roles to CI/CD service account"

# Generate the JSON key
SA_KEY_FILE="intellicore-cicd-sa-key.json"
gcloud iam service-accounts keys create "$SA_KEY_FILE" \
  --iam-account="$CICD_SA" --project "$PROJECT_ID" --quiet
ok "Service account key saved to: $(pwd)/$SA_KEY_FILE"
warn "KEEP THIS FILE SECURE — paste its contents into GitLab CI/CD → Variables → GCP_SA_KEY (File type)"

# ── 6. Cloud DNS ──────────────────────────────────────────────────────────
bold ""
bold "── Step 6/7 · Cloud DNS ─────────────────────────────────────────────────"

ask "Domain for Intellicore CMP (e.g. intellicore-demo.searce.com) [leave blank to keep sslip.io]:"; read -r DOMAIN_INPUT
DOMAIN="${DOMAIN_INPUT:-}"

if [[ -z "$DOMAIN" ]]; then
  DOMAIN="${VM_IP//./-}.sslip.io"
  info "Using auto-TLS domain: https://$DOMAIN (sslip.io — no DNS setup needed)"
else
  # Determine the parent zone
  # If it's *.searce.com, look for a managed zone for searce.com
  PARENT_DOMAIN=$(echo "$DOMAIN" | rev | cut -d. -f1-2 | rev)
  DNS_ZONE=$(gcloud dns managed-zones list --project "$PROJECT_ID" \
    --filter="dnsName:${PARENT_DOMAIN}." --format="value(name)" 2>/dev/null | head -1 || true)

  if [[ -z "$DNS_ZONE" ]]; then
    # Try to find in any project
    warn "No Cloud DNS zone found for $PARENT_DOMAIN in project $PROJECT_ID"
    ask "Cloud DNS zone name to use [leave blank to create a new zone]:"; read -r DNS_ZONE_INPUT
    if [[ -z "$DNS_ZONE_INPUT" ]]; then
      ZONE_NAME="intellicore-zone"
      gcloud dns managed-zones create "$ZONE_NAME" \
        --dns-name="${PARENT_DOMAIN}." \
        --description="Intellicore CMP DNS zone" \
        --project="$PROJECT_ID" --quiet
      ok "Created DNS zone: $ZONE_NAME for $PARENT_DOMAIN"
      DNS_ZONE="$ZONE_NAME"
      warn "Add these nameservers to your domain registrar:"
      gcloud dns managed-zones describe "$ZONE_NAME" --project "$PROJECT_ID" --format="value(nameServers[])"
    else
      DNS_ZONE="$DNS_ZONE_INPUT"
    fi
  else
    ok "Found existing DNS zone: $DNS_ZONE"
  fi

  # Add the A record (delete first if it exists)
  gcloud dns record-sets delete "${DOMAIN}." --type=A --zone="$DNS_ZONE" \
    --project="$PROJECT_ID" --quiet 2>/dev/null || true
  gcloud dns record-sets create "${DOMAIN}." --type=A --ttl=300 \
    --rrdatas="$VM_IP" --zone="$DNS_ZONE" --project="$PROJECT_ID" --quiet
  ok "DNS A record: $DOMAIN → $VM_IP (TTL 300s)"
fi

# Update Caddyfile DOMAIN on the VM (if already deployed)
info "Caddy will use domain: $DOMAIN"

# ── 7. Google Workspace SSO — OAuth 2.0 client ───────────────────────────
bold ""
bold "── Step 7/7 · Google Workspace SSO (OAuth 2.0) ──────────────────────────"

REDIRECT_URI="https://${DOMAIN}/api/auth/google/callback"
info "OAuth redirect URI that you'll need:  $REDIRECT_URI"
echo ""
info "Creating the OAuth 2.0 client requires one manual step in GCP Console."
info "Everything else is automated. Open this URL in your browser:"
echo ""
printf "  ${CYAN}https://console.cloud.google.com/apis/credentials/oauthclient?project=%s${NC}\n" "$PROJECT_ID"
echo ""
info "Fill in:"
printf "  Application type : ${BOLD}Web application${NC}\n"
printf "  Name             : ${BOLD}Intellicore CMP${NC}\n"
printf "  Authorised redirect URIs:\n"
printf "    ${BOLD}%s${NC}\n" "$REDIRECT_URI"
printf "  (also add:  https://${DOMAIN}/api/auth/google/callback)\n"
echo ""
info "If you also need a local dev redirect, add:"
printf "    ${BOLD}http://localhost:3000/api/auth/google/callback${NC}\n"
echo ""
ask "Google OAuth Client ID (paste from Console):"; read -r GOOGLE_CLIENT_ID
ask "Google OAuth Client Secret (paste from Console):"; read -r GOOGLE_CLIENT_SECRET
ask "Allowed Google Workspace domain(s) (comma-separated, e.g. searce.com) [searce.com]:"; read -r ALLOWED_DOMAINS
ALLOWED_DOMAINS="${ALLOWED_DOMAINS:-searce.com}"

# ── Write updated .env.prod ───────────────────────────────────────────────
bold ""
bold "── Writing configuration files ──────────────────────────────────────────"

if [[ -f .env.prod ]]; then
  # Update existing .env.prod in place (preserve all existing secrets)
  TMPENV=$(mktemp)
  cp .env.prod "$TMPENV"
  # Remove any existing Google/Domain lines
  grep -v -E "^(DOMAIN|GOOGLE_OAUTH|GCP_PROJECT)" "$TMPENV" > .env.prod || true

  cat >> .env.prod <<EOF

# Updated by setup-searce-gcp.sh
DOMAIN=${DOMAIN}
GCP_PROJECT_ID=${PROJECT_ID}
GOOGLE_OAUTH_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_OAUTH_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_OAUTH_ALLOWED_DOMAINS=${ALLOWED_DOMAINS}
EOF
  ok "Updated .env.prod (existing secrets preserved)"
else
  warn ".env.prod not found — you'll need to run deploy/gcp/deploy.sh first to generate secrets"
  cat > .env.prod.searce-additions <<EOF
# Add these to your .env.prod:
DOMAIN=${DOMAIN}
GCP_PROJECT_ID=${PROJECT_ID}
GOOGLE_OAUTH_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_OAUTH_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_OAUTH_ALLOWED_DOMAINS=${ALLOWED_DOMAINS}
EOF
  ok "Saved additions to: .env.prod.searce-additions"
fi

# ── Print GitLab CI/CD variable summary ──────────────────────────────────
bold ""
bold "───────────────────────────────────────────────────────────────────────────"
bold "  Searce GCP setup complete ✔"
bold "───────────────────────────────────────────────────────────────────────────"
echo ""
bold "Add these variables in GitLab → Settings → CI/CD → Variables:"
echo ""
printf "  ${BOLD}GCP_SA_KEY${NC}       Type: File   Value: contents of $(pwd)/%s\n" "$SA_KEY_FILE"
printf "  ${BOLD}GCP_PROJECT_ID${NC}   Type: Var    Value: %s\n" "$PROJECT_ID"
printf "  ${BOLD}VM_NAME${NC}          Type: Var    Value: %s\n" "$VM_NAME"
printf "  ${BOLD}VM_ZONE${NC}          Type: Var    Value: %s\n" "$ZONE"
printf "  ${BOLD}VM_USER${NC}          Type: Var    Value: %s\n" "$(echo "$CURRENT_ACCOUNT" | tr '@.' '__')"
printf "  ${BOLD}DOMAIN${NC}           Type: Var    Value: %s\n" "$DOMAIN"
echo ""
bold "Next steps:"
printf "  1. Add variables above to GitLab\n"
printf "  2. Deploy from GitLab (push to main) — it will SSH via IAP, no port 22 needed\n"
printf "  3. Users can now sign in with Google (@%s) on the login page\n" "$ALLOWED_DOMAINS"
echo ""
bold "  Instance URL:  https://${DOMAIN}"
bold "───────────────────────────────────────────────────────────────────────────"
