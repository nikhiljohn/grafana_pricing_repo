output "external_ip" {
  description = "Public IP of the staging VM"
  value       = google_compute_address.static.address
}

output "ssh_command" {
  description = "SSH into the staging VM"
  value       = "gcloud compute ssh ${google_compute_instance.vm.name} --zone=${google_compute_instance.vm.zone}"
}

output "urls" {
  description = "Access URLs (once docker compose is running)"
  value = {
    ui           = "http://${google_compute_address.static.address}:3000"
    api          = "http://${google_compute_address.static.address}:8000/docs"
    neo4j_browser = "http://${google_compute_address.static.address}:7474"
  }
}
