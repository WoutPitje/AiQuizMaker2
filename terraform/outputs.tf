output "static_site_bucket_url" {
  description = "Direct URL to access the static site bucket (HTTP only)"
  value       = "http://${module.storage.static_site_bucket_name}.storage.googleapis.com"
}

output "static_site_bucket_name" {
  description = "Name of the static site bucket"
  value       = module.storage.static_site_bucket_name
}

output "cloud_run_service_url" {
  description = "URL of the Cloud Run API service"
  value       = module.cloud_run.service_url
}

output "artifact_registry_url" {
  description = "URL of the Artifact Registry for Docker images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
}

output "deployment_instructions" {
  description = "Instructions for deploying the application"
  value = <<-EOT
    Static Site Deployment Instructions (with Cloudflare for HTTPS):
    
    1. Deploy the API to Cloud Run:
       cd api
       docker build -t ${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/api:latest .
       docker push ${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/api:latest
    
    2. Build and deploy the Nuxt static site:
       cd web
       export NUXT_PUBLIC_API_URL=${module.cloud_run.service_url}
       npm run generate
       gsutil -m rsync -r -d .output/public/ gs://${module.storage.static_site_bucket_name}/
    
    3. Configure Cloudflare (for HTTPS and custom domain):
       a. Add your domain to Cloudflare
       b. In Cloudflare DNS, create a CNAME record:
          - Name: @ (or subdomain)
          - Target: ${module.storage.static_site_bucket_name}.storage.googleapis.com
          - Proxy status: Proxied (orange cloud)
       c. Enable "Full" SSL/TLS encryption mode in Cloudflare
       d. Set up page rules for proper caching
    
    4. Alternative (HTTP only, no Cloudflare):
       - Create a CNAME record pointing to: ${module.storage.static_site_bucket_name}.storage.googleapis.com
       - Access via: http://${var.domain_name}
    
    5. Test your deployment:
       - With Cloudflare: https://${var.domain_name}
       - Direct bucket access: http://${module.storage.static_site_bucket_name}.storage.googleapis.com
  EOT
}

output "important_notes" {
  description = "Important deployment notes"
  value = <<-EOT
    IMPORTANT NOTES:
    
    1. Google Cloud Storage static hosting only supports HTTP (not HTTPS) for custom domains
    2. For HTTPS with a custom domain, you must use a CDN like Cloudflare (recommended and free)
    3. The API is accessible at: ${module.cloud_run.service_url}
    4. Make sure to configure CORS properly if your frontend and API are on different domains
    5. Storage buckets are already configured with proper website settings and public access
  EOT
} 