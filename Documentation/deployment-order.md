# Correct Deployment Order

## Problem: "Image not found" Error

When deploying with Terraform, you might see:
```
Error: Image 'europe-west4-docker.pkg.dev/.../api:latest' not found
```

This happens because Cloud Run tries to deploy before the Docker image exists.

## Solution: Deploy in Correct Order

### Option 1: Use Quick Deploy Script (Recommended)

```bash
cd terraform
chmod +x quick-deploy.sh
./quick-deploy.sh aiquizmaker-1750103493
```

This script handles everything in the correct order automatically.

### Option 2: Manual Step-by-Step

1. **First, create infrastructure WITHOUT Cloud Run:**
   ```bash
   cd terraform
   terraform apply -target="google_service_account.cloud_run_sa" \
                   -target="google_artifact_registry_repository.docker_repo" \
                   -target="module.storage"
   ```

2. **Configure Docker authentication:**
   ```bash
   gcloud auth configure-docker europe-west4-docker.pkg.dev
   ```

3. **Build and push the API image:**
   ```bash
   cd ../api
   docker build -t europe-west4-docker.pkg.dev/aiquizmaker-1750103493/aiquizmaker-docker/api:latest .
   docker push europe-west4-docker.pkg.dev/aiquizmaker-1750103493/aiquizmaker-docker/api:latest
   ```

4. **Now deploy Cloud Run:**
   ```bash
   cd ../terraform
   terraform apply
   ```

### Option 3: Temporary Workaround

If you want to create all infrastructure first, you can:

1. Comment out the Cloud Run module in `main.tf`
2. Run `terraform apply`
3. Build and push Docker image
4. Uncomment Cloud Run module
5. Run `terraform apply` again

## Why This Happens

- Terraform tries to create all resources at once
- Cloud Run needs a Docker image to exist before it can deploy
- The Docker image can only be pushed after the Artifact Registry exists

## Best Practices

1. **Use CI/CD**: Automate the build and push process
2. **Use the quick deploy script** for initial setup
3. **Keep Docker images versioned** (not just `:latest`)
4. **Document your deployment process** for your team 