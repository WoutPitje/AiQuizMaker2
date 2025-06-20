output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_service.api.name
}

output "service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_service.api.status[0].url
}

output "service_id" {
  description = "ID of the Cloud Run service"
  value       = google_cloud_run_service.api.id
} 