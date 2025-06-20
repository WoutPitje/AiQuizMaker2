# Local variables
locals {
  app_name = "aiquizmaker"
  labels = {
    app         = local.app_name
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "${local.app_name}-run-sa"
  display_name = "Service Account for AiQuizMaker Cloud Run"
  description  = "Service account used by Cloud Run to access GCS buckets"
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "${local.app_name}-docker"
  description   = "Docker repository for AiQuizMaker"
  format        = "DOCKER"
  
  labels = local.labels
  
  depends_on = [google_project_service.required_apis]
}

# Storage module
module "storage" {
  source = "./modules/storage"
  
  project_id   = var.project_id
  region       = var.region
  app_name     = local.app_name
  environment  = var.environment
  domain_name  = var.domain_name
  labels       = local.labels
  
  cloud_run_sa_email = google_service_account.cloud_run_sa.email
}

# Cloud Run module
module "cloud_run" {
  source = "./modules/cloud-run"
  
  project_id                 = var.project_id
  region                     = var.region
  app_name                   = local.app_name
  environment                = var.environment
  labels                     = local.labels
  
  service_account_email      = google_service_account.cloud_run_sa.email
  docker_image               = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/api:latest"
  
  # Application configuration
  openai_api_key             = var.openai_api_key
  max_pdf_size               = var.max_pdf_size
  max_pages_per_pdf          = var.max_pages_per_pdf
  default_questions_per_page = var.default_questions_per_page
  web_url                    = "https://${var.domain_name}"
  
  # Cloud Run configuration
  min_instances              = var.cloud_run_min_instances
  max_instances              = var.cloud_run_max_instances
  cpu                        = var.cloud_run_cpu
  memory                     = var.cloud_run_memory
  timeout                    = var.cloud_run_timeout
  
  # Storage bucket names from storage module
  uploads_bucket_name        = module.storage.uploads_bucket_name
  quiz_storage_bucket_name   = module.storage.quiz_storage_bucket_name
  
  depends_on = [
    google_project_service.required_apis,
    google_artifact_registry_repository.docker_repo
  ]
}

# Note: No load balancer to save costs
# Frontend will be deployed to Firebase Hosting
# API will use Cloud Run's auto-generated URL 