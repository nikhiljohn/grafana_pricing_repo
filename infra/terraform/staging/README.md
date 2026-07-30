# Staging environment on GCP

Provisions a single GCP VM in `asia-south1` that runs the Intellicore CMP
`docker-compose` stack.

**Cost**: ~$60/month (e2-standard-4 + 50GB SSD + static IP).

## Prerequisites

- `gcloud` authenticated to the target project
- Terraform 1.6+
- A GCP project with billing enabled

## Deploy

```bash
cd infra/terraform/staging
terraform init
terraform apply -var project_id=<your-gcp-project> -var region=asia-south1
```

After apply, SSH into the VM:

```bash
gcloud compute ssh intellicore-staging --zone=asia-south1-a
```

...then clone the repo and run `make up`.

## What this creates

- 1× `e2-standard-4` Compute Engine VM (4 vCPU, 16 GB RAM)
- 1× 50 GB SSD boot disk
- 1× static external IP
- Firewall rules for ports 3000 (frontend), 8000 (backend API), 7474 (Neo4j browser — restrict source in prod)
- Startup script that installs Docker + Docker Compose

## What this does NOT create (yet)

- Managed Cloud SQL — using Postgres in Docker for staging
- Managed Neo4j Aura — using Neo4j in Docker for staging
- Load balancer / TLS — add before pointing a real domain at this
- Backups — add for staging before you rely on the graph
