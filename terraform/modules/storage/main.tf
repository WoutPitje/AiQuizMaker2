# Static site bucket for Nuxt SSG
resource "google_storage_bucket" "static_site" {
  name          = var.domain_name
  location      = var.region
  force_destroy = false
  
  # Enable static website hosting
  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
  
  # CORS configuration for the domain
  cors {
    origin          = ["https://${var.domain_name}", "http://${var.domain_name}", "http://localhost:3000"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
  
  # Use uniform bucket-level access for simplicity
  uniform_bucket_level_access = true
  
  labels = var.labels
}

# Make static site bucket publicly readable
resource "google_storage_bucket_iam_member" "static_site_public" {
  bucket = google_storage_bucket.static_site.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Create a default index.html if the bucket is empty (optional)
resource "google_storage_bucket_object" "default_index" {
  name   = "index.html"
  bucket = google_storage_bucket.static_site.name
  content = <<-HTML
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Quiz Maker - Coming Soon</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <h1>AI Quiz Maker</h1>
      <p>Site deployment in progress. Please check back soon!</p>
    </body>
    </html>
  HTML
  
  # Only create if bucket is empty
  lifecycle {
    ignore_changes = [content, crc32c, md5hash]
  }
}

# Uploads bucket for temporary PDF storage
resource "google_storage_bucket" "uploads" {
  name          = "${var.app_name}-${var.environment}-uploads"
  location      = var.region
  force_destroy = false
  
  cors {
    origin          = ["https://${var.domain_name}", "http://localhost:3000"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
  
  lifecycle_rule {
    condition {
      age = 1 # Delete uploads after 1 day
    }
    action {
      type = "Delete"
    }
  }
  
  uniform_bucket_level_access = true
  
  labels = var.labels
}

# Quiz storage bucket for persistent quiz data
resource "google_storage_bucket" "quiz_storage" {
  name          = "${var.app_name}-${var.environment}-quiz-storage"
  location      = var.region
  force_destroy = false
  
  cors {
    origin          = ["https://${var.domain_name}", "http://localhost:3000"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }
  
  uniform_bucket_level_access = true
  
  labels = var.labels
}

# Grant Cloud Run service account access to uploads bucket
resource "google_storage_bucket_iam_member" "uploads_access" {
  bucket = google_storage_bucket.uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.cloud_run_sa_email}"
}

# Grant Cloud Run service account access to quiz storage bucket
resource "google_storage_bucket_iam_member" "quiz_storage_access" {
  bucket = google_storage_bucket.quiz_storage.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.cloud_run_sa_email}"
} 