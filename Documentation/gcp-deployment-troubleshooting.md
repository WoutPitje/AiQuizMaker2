# GCP Deployment Troubleshooting

## Common Issues and Solutions

### 1. Cloud Run PORT Environment Variable Error

**Error**: 
```
The following reserved env names were provided: PORT. These values are automatically set by the system.
```

**Solution**: 
Cloud Run automatically sets the `PORT` environment variable. Don't include it in your Terraform configuration or Dockerfile ENV instructions. Your application should read `process.env.PORT` with a fallback value.

**Fixed in**: 
- Removed `PORT` from `terraform/modules/cloud-run/main.tf`
- Removed `ENV PORT=8080` from `api/Dockerfile`
- API already correctly reads: `const port = process.env.PORT || 3001`

### 2. Terraform State Issues

**Error**: Resource already exists

**Solution**:
```bash
# Import existing resources
terraform import module.storage.google_storage_bucket.static_site aiquizmaker-prod-static

# Or refresh state
terraform refresh
```

### 3. SSL Certificate Not Working

**Issue**: HTTPS not working after deployment

**Solutions**:
1. DNS propagation can take up to 48 hours
2. SSL certificate provisioning takes up to 15 minutes
3. Check certificate status:
   ```bash
   gcloud compute ssl-certificates describe aiquizmaker-prod-ssl-cert
   ```

### 4. API Connection Errors

**Issue**: Frontend can't connect to API

**Checks**:
1. Verify CORS settings in `api/src/main.ts`
2. Check Cloud Run service is running:
   ```bash
   gcloud run services describe aiquizmaker-api --region=europe-west4
   ```
3. Test API directly:
   ```bash
   curl https://your-domain.com/api/config
   ```

### 5. Storage Permission Errors

**Error**: Cloud Run can't access storage buckets

**Solution**:
```bash
# Grant service account permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:aiquizmaker-run-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### 6. Build Failures

**Issue**: Docker build fails in Cloud Build

**Common causes**:
1. Missing dependencies in package.json
2. TypeScript errors
3. Memory issues during build

**Solution**:
```bash
# Test build locally first
docker build -t test-api ./api

# Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### 7. Cold Start Issues

**Issue**: First request after idle is slow

**Solutions**:
1. Set minimum instances to 1 (costs ~$30/month):
   ```hcl
   cloud_run_min_instances = 1
   ```
2. Use Cloud Scheduler to keep warm:
   ```bash
   gcloud scheduler jobs create http warmup-api \
     --location=europe-west4 \
     --schedule="*/5 * * * *" \
     --uri="https://your-domain.com/api/config"
   ```

### 8. Debugging Tips

**View Cloud Run logs**:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=aiquizmaker-api" --limit=50
```

**SSH into Cloud Run (for debugging)**:
```bash
gcloud run services update aiquizmaker-api --region=europe-west4 --args="--","/bin/sh"
```

**Check resource quotas**:
```bash
gcloud compute project-info describe --project=YOUR_PROJECT_ID
``` 