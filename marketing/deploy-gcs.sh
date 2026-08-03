#!/usr/bin/env bash
# ─── Intellicore CMP marketing site — deploy to GCS static hosting ──────
#
# Publishes marketing/index.html to a public Cloud Storage bucket
# configured for static website hosting. This is a deliberately
# separate, tiny deployment from the app itself (deploy/gcp/deploy.sh) —
# no VM, no database, just a static page on its own URL.
#
# Run from the repo root in Cloud Shell:
#   bash marketing/deploy-gcs.sh
#
# Cost: a few cents/month (GCS storage + egress for a single HTML page).
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
BUCKET_NAME="${BUCKET_NAME:-intellicore-cmp-site-$(date +%s | tail -c 6)}"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }

if [[ ! -f marketing/index.html ]]; then
  echo "ERROR: run this from the repo root:  bash marketing/deploy-gcs.sh" >&2
  exit 1
fi

bold "── Step 1/4 · Project ─────────────────────────────────────────────"
read -rp "GCP project ID [${PROJECT_ID}]: " P && PROJECT_ID="${P:-$PROJECT_ID}"
gcloud config set project "$PROJECT_ID" --quiet
gcloud services enable storage.googleapis.com --quiet

bold "── Step 2/4 · Create the bucket ───────────────────────────────────"
read -rp "Bucket name (must be globally unique) [${BUCKET_NAME}]: " B
BUCKET_NAME="${B:-$BUCKET_NAME}"
gcloud storage buckets create "gs://${BUCKET_NAME}" \
  --location=asia-south1 \
  --uniform-bucket-level-access \
  --quiet 2>/dev/null || echo "  Bucket already exists — reusing it."

bold "── Step 3/4 · Configure static website hosting + public access ────"
gcloud storage buckets update "gs://${BUCKET_NAME}" \
  --web-main-page-suffix=index.html \
  --web-error-page=index.html

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member=allUsers --role=roles/storage.objectViewer --quiet

bold "── Step 4/4 · Upload the site ──────────────────────────────────────"
gcloud storage cp marketing/index.html "gs://${BUCKET_NAME}/index.html" \
  --cache-control="public, max-age=300"

bold "───────────────────────────────────────────────────────────────────"
bold "  ✔ Intellicore CMP marketing site is live:"
echo "    https://storage.googleapis.com/${BUCKET_NAME}/index.html"
echo ""
echo "  To put it on a custom domain (e.g. intellicore.searce.com):"
echo "    1. Reserve a static IP + create an HTTPS load balancer with this"
echo "       bucket as its backend (Cloud Console → Load Balancing → Create,"
echo "       backend type: Cloud Storage bucket)."
echo "    2. Point your domain's A record at the load balancer's IP."
echo "    3. Attach a Google-managed SSL certificate for the domain."
echo "    This takes ~15-60 min for the cert to provision; the bucket URL"
echo "    above works immediately in the meantime."
echo ""
echo "  To update the site after editing marketing/index.html, re-run:"
echo "    gcloud storage cp marketing/index.html gs://${BUCKET_NAME}/index.html --cache-control=\"public, max-age=300\""
bold "───────────────────────────────────────────────────────────────────"
