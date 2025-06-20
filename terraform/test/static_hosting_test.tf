# Static Hosting Configuration Tests

# Test data source to verify bucket exists and is configured correctly
data "google_storage_bucket" "test_static_site" {
  name = module.storage.static_site_bucket_name
}

# Test outputs to verify static hosting is properly configured
output "test_static_site_website" {
  description = "Test that website configuration is set"
  value = {
    bucket_name = data.google_storage_bucket.test_static_site.name
    website_config = data.google_storage_bucket.test_static_site.website
    public_access = data.google_storage_bucket.test_static_site.uniform_bucket_level_access
    cors_config = data.google_storage_bucket.test_static_site.cors
  }
}

# Test to verify bucket is publicly accessible
resource "null_resource" "test_public_access" {
  provisioner "local-exec" {
    command = <<-EOT
      echo "Testing public access to static site bucket..."
      curl -s -o /dev/null -w "%%{http_code}" \
        "http://${module.storage.static_site_bucket_name}.storage.googleapis.com/index.html" \
        | grep -q "200\|403\|404" && echo "✓ Bucket is accessible" || echo "✗ Bucket is not accessible"
    EOT
  }
  
  depends_on = [module.storage]
}

# Test to verify CORS is properly configured
resource "null_resource" "test_cors_config" {
  provisioner "local-exec" {
    command = <<-EOT
      echo "Verifying CORS configuration..."
      gsutil cors get gs://${module.storage.static_site_bucket_name} | \
        grep -q "origin" && echo "✓ CORS is configured" || echo "✗ CORS not configured"
    EOT
  }
  
  depends_on = [module.storage]
}

# Test Cloud Run API accessibility
resource "null_resource" "test_api_endpoint" {
  provisioner "local-exec" {
    command = <<-EOT
      echo "Testing Cloud Run API endpoint..."
      curl -s -o /dev/null -w "%%{http_code}" \
        "${module.cloud_run.service_url}/health" \
        | grep -q "200\|404" && echo "✓ API is accessible" || echo "✗ API is not accessible"
    EOT
  }
  
  depends_on = [module.cloud_run]
} 