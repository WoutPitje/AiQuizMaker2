output "static_site_bucket_name" {
  description = "Name of the static site bucket"
  value       = google_storage_bucket.static_site.name
}

output "static_site_bucket_url" {
  description = "URL of the static site bucket"
  value       = google_storage_bucket.static_site.url
}

output "static_site_website_endpoint" {
  description = "Website endpoint for the static site bucket"
  value       = "http://${google_storage_bucket.static_site.name}.storage.googleapis.com"
}

output "uploads_bucket_name" {
  description = "Name of the uploads bucket"
  value       = google_storage_bucket.uploads.name
}

output "quiz_storage_bucket_name" {
  description = "Name of the quiz storage bucket"
  value       = google_storage_bucket.quiz_storage.name
} 