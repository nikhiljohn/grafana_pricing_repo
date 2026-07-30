variable "project_id" {
  description = "Target GCP project id"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

variable "machine_type" {
  description = "Compute Engine machine type"
  type        = string
  default     = "e2-standard-4"
}
