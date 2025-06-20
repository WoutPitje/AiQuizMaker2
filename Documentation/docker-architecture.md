# Docker Architecture for Cloud Run Deployment

## Important: Build for the Right Architecture

Cloud Run runs on **x86_64/amd64** architecture. If you're building on an ARM machine (like Apple M1/M2), you must build for the correct architecture.

## Building for x86_64/amd64

### Option 1: Using Docker Buildx (Recommended)

Docker Buildx supports multi-platform builds:

```bash
# Create a buildx builder (only needed once)
docker buildx create --name multiplatform --use

# Build and push for amd64
docker buildx build \
  --platform linux/amd64 \
  --tag your-registry/your-image:latest \
  --push \
  .
```

### Option 2: Using Standard Docker Build

If buildx is not available:

```bash
# Set the default platform
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Build with platform flag
docker build --platform linux/amd64 -t your-image:latest .

# Then push
docker push your-image:latest
```

### Option 3: Using QEMU Emulation

For consistent builds across platforms:

```bash
# Install QEMU
docker run --privileged --rm tonistiigi/binfmt --install all

# Now build normally
docker build --platform linux/amd64 -t your-image:latest .
```

## Verifying Image Architecture

Check your image architecture:

```bash
# Inspect the image
docker inspect your-image:latest | grep Architecture

# Or use manifest inspect
docker manifest inspect your-image:latest | grep architecture
```

## Common Issues

### Issue: "exec format error" on Cloud Run
- **Cause**: Image built for ARM instead of x86_64
- **Solution**: Rebuild with `--platform linux/amd64`

### Issue: Slow builds on ARM machines
- **Cause**: QEMU emulation overhead
- **Solution**: Use buildx with remote builders or CI/CD

### Issue: Image works locally but not on Cloud Run
- **Cause**: Different architectures between local and Cloud Run
- **Solution**: Always specify `--platform linux/amd64`

## Best Practices

1. **Always specify platform**: Use `--platform linux/amd64` in builds
2. **Use CI/CD**: Build in consistent x86_64 environments
3. **Test architecture**: Verify image architecture before deploying
4. **Document build process**: Ensure team knows about architecture requirements

## Scripts Updated for x86_64

Our deployment scripts automatically handle architecture:
- `deploy-api.sh` - Builds for linux/amd64
- `terraform/quick-deploy.sh` - Builds for linux/amd64

Both scripts detect if Docker buildx is available and use it for optimal builds. 