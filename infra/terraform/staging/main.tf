terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.10"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  name = "intellicore-staging"
  labels = {
    app        = "intellicore-cmp"
    env        = "staging"
    managed-by = "terraform"
  }
}

resource "google_compute_address" "static" {
  name   = "${local.name}-ip"
  region = var.region
}

resource "google_compute_firewall" "allow_web" {
  name    = "${local.name}-allow-web"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443", "3000", "8000", "7474"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = [local.name]
}

resource "google_compute_instance" "vm" {
  name         = local.name
  machine_type = var.machine_type
  zone         = "${var.region}-a"
  tags         = [local.name]
  labels       = local.labels

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 50
      type  = "pd-ssd"
    }
  }

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.static.address
    }
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    set -e
    apt-get update
    apt-get install -y ca-certificates curl gnupg git make
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
  EOT
}
