# GitLab CI/CD Setup — Intellicore CMP

One-time setup to connect your Searce GitLab instance to your GCP VM.
After this, every push to `main` automatically deploys.

---

## What you need

- Access to your Searce GitLab project (Owner or Maintainer)
- SSH access to the GCP VM (`gcloud compute ssh intellicore-cmp-prod --zone asia-south1-a`)
- ~15 minutes

---

## Step 1 — Generate a deploy SSH key pair

Run this **locally** (or in Cloud Shell). This key is only for CI/CD — separate from your personal key.

```bash
ssh-keygen -t ed25519 -C "intellicore-gitlab-deploy" -f ~/.ssh/intellicore_deploy -N ""
```

This creates two files:
- `~/.ssh/intellicore_deploy` — **private key** (goes into GitLab)
- `~/.ssh/intellicore_deploy.pub` — **public key** (goes onto the VM)

---

## Step 2 — Add the public key to the GCP VM

```bash
# SSH into the VM
gcloud compute ssh intellicore-cmp-prod --zone asia-south1-a

# On the VM, add the public key
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify it was added
tail -1 ~/.ssh/authorized_keys
```

Replace `PASTE_YOUR_PUBLIC_KEY_HERE` with the contents of `~/.ssh/intellicore_deploy.pub`.

To get the public key content:
```bash
cat ~/.ssh/intellicore_deploy.pub
```

---

## Step 3 — Open SSH on the VM firewall (if not already open)

The VM firewall currently allows ports 80 and 443 only. GitLab's CI runners need port 22.

```bash
# Run in Cloud Shell
gcloud compute firewall-rules create intellicore-allow-ssh-cicd \
  --allow=tcp:22 \
  --target-tags=intellicore \
  --source-ranges=0.0.0.0/0 \
  --description="Allow SSH from GitLab CI runners" \
  --quiet
```

> **Security note:** To restrict this to Searce GitLab's runner IPs only,
> replace `0.0.0.0/0` with the runner IP range from your GitLab admin panel
> (Admin Area → Runners → look for the runner IP).

---

## Step 4 — Add CI/CD variables in GitLab

Go to your GitLab project → **Settings → CI/CD → Variables → Add variable**.

Add each of these:

| Variable | Type | Value | Protected | Masked |
|---|---|---|---|---|
| `DEPLOY_SSH_KEY` | **File** | Contents of `~/.ssh/intellicore_deploy` (the private key) | ✓ | ✓ |
| `VM_IP` | Variable | Your VM's public IP (e.g. `35.234.213.235`) | ✓ | ✗ |
| `VM_USER` | Variable | SSH username on the VM (e.g. `nikhil_john_searce_com` or `ubuntu`) | ✓ | ✗ |
| `DOMAIN` | Variable | Your sslip.io domain (e.g. `35-234-213-235.sslip.io`) | ✓ | ✗ |

### Finding your VM_USER

```bash
# The username is derived from your gcloud account, with dots/@ replaced by underscores
gcloud compute ssh intellicore-cmp-prod --zone asia-south1-a --command "whoami"
```

### Setting DEPLOY_SSH_KEY as a File variable

1. In GitLab, click **Add variable**
2. Set **Type** to **File**
3. Paste the entire private key including the `-----BEGIN` and `-----END` lines
4. Enable **Protect variable** and **Mask variable**

---

## Step 5 — Make sure the repo remote on the VM points to GitLab

If the VM currently has the repo cloned from GitHub, update the remote:

```bash
# SSH into the VM
gcloud compute ssh intellicore-cmp-prod --zone asia-south1-a

# Check current remote
cd ~/intellicore-cmp && git remote -v

# Update to GitLab (replace with your actual GitLab repo URL)
git remote set-url origin https://gitlab.searce.com/<your-group>/intellicore-cmp.git
# OR if using SSH:
# git remote set-url origin git@gitlab.searce.com:<your-group>/intellicore-cmp.git

# Verify
git remote -v
```

---

## Step 6 — Push to main and watch it deploy

```bash
git push origin main
```

Go to your GitLab project → **CI/CD → Pipelines** to watch the run.

A successful pipeline looks like:
```
frontend:build  ✓  ~3 min
deploy:production  ✓  ~4 min
```

---

## Manual deploy (from VM, without CI/CD)

```bash
gcloud compute ssh intellicore-cmp-prod --zone asia-south1-a

cd ~/intellicore-cmp
git pull origin main
bash deploy/gcp/update.sh
```

---

## Troubleshooting

### "Permission denied (publickey)"
- Check the public key is in `~/.ssh/authorized_keys` on the VM
- Check `DEPLOY_SSH_KEY` in GitLab is the **private** key (not the `.pub` file)
- Ensure the variable type is **File**, not **Variable**

### "ssh: connect to host X port 22: Connection refused"
- The firewall rule in Step 3 may not be applied yet (allow 1–2 min)
- Verify: `gcloud compute firewall-rules list | grep intellicore`

### "git fetch: Permission denied" on VM
- The VM's git remote may not have credentials for GitLab
- Use HTTPS with a GitLab deploy token: **Settings → Repository → Deploy tokens**
- Set the remote: `git remote set-url origin https://gitlab-ci-token:$TOKEN@gitlab.searce.com/...`

### Build fails with "npm: command not found"
- The `frontend:build` stage uses `node:20-alpine` — this is the GitLab runner's image, not the VM
- If your GitLab runner can't pull from Docker Hub, change `image: node:20-alpine` to a
  mirror available in your Searce network

### Pipeline doesn't trigger
- Check that the branch is named `main` (not `master`)
- Check **Settings → CI/CD → General pipelines → Pipeline status** is enabled
- The `.gitlab-ci.yml` must be in the repo root

---

## Pipeline badge (optional)

Add to your GitLab project's README:

```markdown
[![pipeline status](https://gitlab.searce.com/<group>/<project>/badges/main/pipeline.svg)](https://gitlab.searce.com/<group>/<project>/-/pipelines)
```
