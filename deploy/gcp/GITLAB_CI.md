# GitLab CI/CD Setup — Intellicore CMP (Searce GCP)

Automatic deploy to your GCP VM on every push to `main`.
Uses **GCP Identity-Aware Proxy** — no open SSH port, no deploy keys.

---

## Prerequisites

- Access to the Searce GitLab project (Owner or Maintainer)
- `gcloud` CLI authenticated as your `@searce.com` account
- You've run `bash deploy/gcp/setup-searce-gcp.sh` (it does the GCP setup for you)

---

## Step 1 — Run the setup script

This one command does everything on the GCP side:

```bash
# From the repo root:
bash deploy/gcp/setup-searce-gcp.sh
```

What it does:
- Creates / reuses a GCP project in the Searce org
- Enables required APIs
- Provisions the VM with a static IP
- Opens SSH only to GCP's IAP range (`35.235.240.0/20`) — not to `0.0.0.0/0`
- Creates a `intellicore-cicd` service account with IAP tunnel + Compute Viewer roles
- Generates a JSON key saved as `intellicore-cicd-sa-key.json`
- Configures Cloud DNS A record for your domain
- Walks you through the Google OAuth client setup for Workspace SSO

At the end it prints the exact 6 variables you need to paste into GitLab.

---

## Step 2 — Add CI/CD variables in GitLab

Go to your project → **Settings → CI/CD → Variables → Add variable**.

| Variable | Type | Value |
|---|---|---|
| `GCP_SA_KEY` | **File** | Full contents of `intellicore-cicd-sa-key.json` |
| `GCP_PROJECT_ID` | Variable | e.g. `intellicore-cmp-prod` |
| `VM_NAME` | Variable | e.g. `intellicore-cmp-prod` |
| `VM_ZONE` | Variable | e.g. `asia-south1-a` |
| `VM_USER` | Variable | Your SSH username on the VM (see below) |
| `DOMAIN` | Variable | e.g. `intellicore-demo.searce.com` |

**Finding VM_USER:**
```bash
gcloud compute ssh intellicore-cmp-prod --zone asia-south1-a \
  --tunnel-through-iap --command "whoami"
```
It's typically your Google account with `@` and `.` replaced by `_`
(e.g. `nikhil_john_searce_com`).

**Setting GCP_SA_KEY as a File variable:**
1. Click **Add variable**
2. Set **Type** → **File**
3. Paste the full JSON content (starting with `{`)
4. Enable **Protect variable** (⚠️ don't mask — it contains newlines)

---

## Step 3 — Make sure the VM's git remote points to Searce GitLab

The pipeline does a `git pull` on the VM. The remote must be the GitLab repo.

```bash
# SSH into the VM via IAP
gcloud compute ssh intellicore-cmp-prod --zone asia-south1-a --tunnel-through-iap

# On the VM:
cd ~/intellicore-cmp
git remote -v                      # check current remote

# Update to GitLab (replace with your actual URL):
git remote set-url origin https://gitlab.searce.com/<group>/intellicore-cmp.git

# For SSH-based (no token needed at pull time):
git remote set-url origin git@gitlab.searce.com:<group>/intellicore-cmp.git
```

---

## Step 4 — Push to main

```bash
git push origin main
```

Go to **CI/CD → Pipelines** to watch:

```
frontend:build     ✓  ~3 min   (npm ci + npm run build)
deploy:production  ✓  ~4 min   (IAP SSH → git pull → docker compose up)
```

---

## How IAP tunnel works

```
GitLab Runner
    │
    │  gcloud compute ssh (service account auth)
    ▼
Google IAP ──── authenticates SA ────► GCP Firewall (allows 35.235.240.0/20 only)
                                            │
                                            ▼ port 22
                                      intellicore-cmp-prod VM
```

No public SSH port exposed. The only way in is through IAP with a valid GCP identity.

---

## Manual deploy (without CI/CD)

```bash
# From your laptop / Cloud Shell:
gcloud compute ssh intellicore-cmp-prod \
  --zone asia-south1-a \
  --tunnel-through-iap \
  --command 'cd ~/intellicore-cmp && git pull origin main && bash deploy/gcp/update.sh'
```

---

## Troubleshooting

### "Required 'compute.instances.get' permission"
The CI/CD service account is missing the Compute Viewer role. Fix:
```bash
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:intellicore-cicd@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/compute.viewer"
```

### "Error: Unable to connect to the service"
IAP isn't enabled or the IAP firewall rule is missing:
```bash
# Check the IAP firewall rule exists
gcloud compute firewall-rules list --filter="name:intellicore-allow-iap-ssh"

# Re-run the setup script section 4 if missing
```

### "Permission denied" when doing git pull on the VM
The VM's git remote needs credentials for GitLab. Use a GitLab Deploy Token:
1. **Settings → Repository → Deploy Tokens** → create one with `read_repository` scope
2. On the VM: `git remote set-url origin https://<token-username>:<token>@gitlab.searce.com/...`

### Pipeline doesn't trigger
- Check the branch is named `main`
- Check `.gitlab-ci.yml` is in the repo root
- Check **Settings → CI/CD → Runners** — at least one runner must be active

---

## Key differences from SSH-key approach

| | SSH key approach (old) | IAP approach (new) |
|---|---|---|
| Port 22 open to internet | ✓ Yes | ✗ No |
| Key rotation needed | Every 90 days | Never (SA key managed by GCP) |
| GitLab variable | SSH private key | GCP service account JSON |
| Auth mechanism | SSH keypair | Google IAM + IAP |
| Audit trail | None | Cloud Audit Logs |
