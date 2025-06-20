# Cloud Run Service
resource "google_cloud_run_service" "api" {
  name     = "${var.app_name}-api"
  location = var.region
  
  template {
    spec {
      service_account_name = var.service_account_email
      
      containers {
        image = var.docker_image
        
        ports {
          container_port = 8080
        }
        
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        env {
          name  = "OPENAI_API_KEY"
          value = var.openai_api_key
        }
        
        env {
          name  = "MAX_PDF_SIZE"
          value = tostring(var.max_pdf_size)
        }
        
        env {
          name  = "MAX_PAGES_PER_PDF"
          value = tostring(var.max_pages_per_pdf)
        }
        
        env {
          name  = "DEFAULT_QUESTIONS_PER_PAGE"
          value = tostring(var.default_questions_per_page)
        }
        
        env {
          name  = "WEB_URL"
          value = var.web_url
        }
        
        env {
          name  = "UPLOADS_BUCKET"
          value = var.uploads_bucket_name
        }
        
        env {
          name  = "QUIZ_STORAGE_BUCKET"
          value = var.quiz_storage_bucket_name
        }
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        
        resources {
          limits = {
            cpu    = var.cpu
            memory = var.memory
          }
        }
      }
      
      container_concurrency = 1000
      timeout_seconds       = var.timeout
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = tostring(var.min_instances)
        "autoscaling.knative.dev/maxScale" = tostring(var.max_instances)
        "run.googleapis.com/cpu-throttling" = "false"
      }
      
      labels = var.labels
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  autogenerate_revision_name = true
}

# Allow unauthenticated access to the API
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.api.name
  location = google_cloud_run_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
} 