# Deployment Guide: Adventure Dashboard Frontend

**Application**: Adventure Dashboard  
**Language/Platform**: React 18 + Vite + TypeScript  
**Last Updated**: January 30, 2026  
**Version**: 1.0.0

---

## Overview

This guide provides step-by-step instructions for deploying the Adventure Dashboard frontend to production and staging environments.

---

## Prerequisites

- Node.js 18+ and npm 9+ installed
- Access to deployment infrastructure (AWS S3, Netlify, Vercel, etc.)
- Environment credentials configured
- Backend API running and accessible

---

## Environment Setup

### Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation clean (`npm run lint`)
- [ ] Production bundle builds successfully (`npm run build`)
- [ ] No console errors or warnings
- [ ] Feature flags configured for target environment
- [ ] Backend API URL verified and accessible
- [ ] Security headers configured
- [ ] CORS configured on backend API
- [ ] SSL/TLS certificates valid

### Environment Variables

#### Development (.env.development)

```env
VITE_API_URL=http://localhost:5000
VITE_DEBUG_API=true
VITE_DEBUG_TYPES=true
VITE_ENV=development
```

#### Staging (.env.staging)

```env
VITE_API_URL=https://api-staging.example.com
VITE_DEBUG_API=false
VITE_ENV=staging
```

#### Production (.env.production)

```env
VITE_API_URL=https://api.example.com
VITE_DEBUG_API=false
VITE_MOCK_API=false
VITE_ENV=production
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

---

## Building for Production

### 1. Generate API Types

```bash
# Generate TypeScript types from backend OpenAPI spec
npm run generate:api

# Verify types generated correctly
ls -la src/types/api.ts
```

### 2. Build Optimized Bundle

```bash
# Build production bundle (includes minification, tree-shaking, etc.)
npm run build

# Review bundle output
ls -lh dist/assets/

# Expected output:
# - index-*.js: ~240 KB (77 KB gzipped) ✅
# - DashboardPage-*.js: ~43 KB (15 KB gzipped) ✅
# - index-*.css: ~5 KB (1.4 KB gzipped) ✅
```

### 3. Preview Production Build

```bash
# Test the production build locally before deployment
npm run preview

# Visit http://localhost:4173 in browser
# Verify all features work correctly
```

---

## Deployment Methods

### Option 1: AWS S3 + CloudFront

**Recommended for**: Production deployments with CDN caching

#### Setup S3 Bucket

```bash
# Create S3 bucket for frontend
aws s3 mb s3://adventure-dashboard-prod

# Enable static website hosting
aws s3api put-bucket-website \
  --bucket adventure-dashboard-prod \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }'

# Block public access (use CloudFront only)
aws s3api put-public-access-block \
  --bucket adventure-dashboard-prod \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

#### Deploy to S3

```bash
# Build production bundle
npm run build

# Upload to S3 with cache busting for assets
aws s3 sync dist/ s3://adventure-dashboard-prod/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache (so updates are always fresh)
aws s3 cp dist/index.html s3://adventure-dashboard-prod/index.html \
  --cache-control "public, max-age=0, must-revalidate"

# Verify upload
aws s3 ls s3://adventure-dashboard-prod/ --recursive
```

#### CloudFront Distribution

```bash
# Create CloudFront distribution pointing to S3
# (This is typically done via AWS Console or Terraform)

# After setup, invalidate cache for new deployment
aws cloudfront create-invalidation \
  --distribution-id E1234EXAMPLE \
  --paths "/*"
```

#### Rollback

```bash
# List previous versions in S3
aws s3api list-object-versions \
  --bucket adventure-dashboard-prod

# Restore previous version
aws s3api get-object \
  --bucket adventure-dashboard-prod \
  --key dist/assets/index-*.js \
  --version-id <VERSION_ID> dist/index.js
```

---

### Option 2: Netlify (Recommended for Simplicity)

**Recommended for**: Staging environments and smaller deployments

#### Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build production bundle
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Output includes live URL
```

#### Deploy via Git

```bash
# Connect GitHub repo to Netlify
netlify connect

# Configure build settings
# - Build command: npm run build
# - Publish directory: dist
# - Environment variables: VITE_API_URL, etc.

# Push to main branch - automatic deployment triggers
git push origin main
```

#### Environment Variables on Netlify

```bash
# Set via Netlify dashboard or CLI
netlify env:set VITE_API_URL https://api.example.com
netlify env:set VITE_ENV production

# Deploy with variables
netlify deploy --prod
```

---

### Option 3: Vercel (Recommended for Full-Stack Integration)

**Recommended for**: Next.js migration or serverless functions

#### Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

#### Deploy via Git

```bash
# Link repo to Vercel
vercel link

# Configure project settings
# - Framework preset: Vite
# - Build command: npm run build
# - Output directory: dist

# Push to branch - automatic deployment
git push origin main
```

#### Serverless Functions (Optional)

```bash
# Add API proxy for authentication
# api/auth.ts
export default (req, res) => {
  // Refresh JWT token, etc.
  res.json({ token: newToken });
};
```

---

### Option 4: Docker Container Deployment

**Recommended for**: Kubernetes or Docker Compose environments

#### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Generate API types
RUN npm run generate:api

# Build production bundle
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install static file server
RUN npm install -g http-server

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/index.html', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server (serve SPA with fallback to index.html for routing)
CMD ["http-server", "dist", "-p", "3000", "-c-1", "--spa"]
```

#### Build and Deploy

```bash
# Build Docker image
docker build -t adventure-dashboard:latest .

# Test locally
docker run -p 3000:3000 adventure-dashboard:latest

# Push to container registry
docker tag adventure-dashboard:latest gcr.io/project/adventure-dashboard:latest
docker push gcr.io/project/adventure-dashboard:latest

# Deploy to Kubernetes
kubectl set image deployment/adventure-dashboard \
  dashboard=gcr.io/project/adventure-dashboard:latest
```

---

## Post-Deployment Verification

### Smoke Tests

```bash
# 1. Check application loads
curl -I https://dashboard.example.com

# 2. Verify API requests work
curl -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/adventures

# 3. Check bundle sizes
curl -I https://dashboard.example.com/assets/index-*.js | grep content-length

# 4. Verify security headers
curl -I https://dashboard.example.com | grep -E "X-Content-Type-Options|X-Frame-Options"
```

### Performance Monitoring

```bash
# Use Lighthouse CI for performance benchmarking
npm install -g @lhci/cli@

# Run Lighthouse audit
lhci autorun --config=lhci.config.json

# Expected results:
# - Performance: >90
# - Accessibility: >95
# - Best Practices: >90
# - SEO: >90
```

### Error Tracking

```bash
# Monitor Sentry for production errors
# (if configured)

# Check CloudFront error logs for 4xx/5xx errors
aws logs tail /aws/cloudfront/adventure-dashboard --follow
```

### Analytics

```bash
# Verify Google Analytics is tracking events
# Check GA dashboard for page views, user sessions, etc.

# Set up custom events for important user actions
# - Adventure created
# - Adventure deleted
# - Navigation to game
```

---

## Rollback Procedures

### AWS S3 + CloudFront

```bash
# List deployed versions
aws s3api list-object-versions --bucket adventure-dashboard-prod

# Copy previous version to current
aws s3 cp s3://adventure-dashboard-prod/assets/index-abc123.js \
         s3://adventure-dashboard-prod/assets/index-current.js

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234EXAMPLE \
  --paths "/*"

# Verify rollback
curl https://dashboard.example.com
```

### Netlify

```bash
# Select previous deployment from Netlify dashboard
# or via CLI:
netlify deploy --prod --dir=dist

# Automatic CI/CD:
git revert <commit-hash>
git push origin main
```

### Vercel

```bash
# Via Vercel dashboard: Deployments → Click previous deployment → Promote

# Via CLI:
vercel --prod --env VITE_API_URL=https://api.example.com
```

---

## Security Considerations

### SSL/TLS Certificates

```bash
# Verify certificate validity
openssl s_client -connect dashboard.example.com:443

# Certificate should not expire within 30 days
# Use Let's Encrypt for auto-renewal
```

### Security Headers

```bash
# Configure in web server (nginx, CloudFront, etc.)
# Content-Security-Policy
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains

# Example (CloudFront distribution):
# Cache behavior → Custom headers → Add headers
```

### API Authentication

```bash
# Frontend should send Authorization header
# with JWT token from localStorage

# Verify CORS configuration on backend
# Allow only specific origins:
# Access-Control-Allow-Origin: https://dashboard.example.com

# Never expose sensitive credentials in frontend
# All secret API keys must remain backend-only
```

### Environment Secrets

```bash
# Use secrets management service
# - AWS Secrets Manager
# - HashiCorp Vault
# - GitHub Actions Secrets
# - Netlify Environment Secrets

# Does NOT include secrets in frontend bundle
# All VITE_ variables are public (embedded in bundle)
```

---

## Monitoring & Maintenance

### Uptime Monitoring

```bash
# Use monitoring service (Datadog, New Relic, etc.)
# Monitor these endpoints:
# - GET /index.html (200 OK)
# - GET /assets/index-*.js (200 OK)
# - Backend API /api/adventures (200 OK with valid token)

# Set up alerts for:
# - HTTP 5xx errors
# - API response time > 5s
# - Deployment failures
```

### Log Aggregation

```bash
# Centralize logs from:
# - CDN error logs (CloudFront, Cloudflare)
# - Browser error tracking (Sentry)
# - Frontend analytics (Google Analytics)
# - Backend API logs

# Use ELK Stack or CloudWatch for aggregation
```

### Regular Updates

```bash
# Schedule weekly dependency updates
npm outdated

# Review security vulnerabilities
npm audit

# Update if no breaking changes
npm update

# Rebuild and redeploy
npm run build
netlify deploy --prod --dir=dist
```

---

## Troubleshooting

### Common Deployment Issues

| Issue                      | Cause                             | Solution                                                |
| -------------------------- | --------------------------------- | ------------------------------------------------------- |
| 404 on page refresh        | SPA routing not configured        | Configure fallback to index.html                        |
| API CORS errors            | CORS not enabled on backend       | Add `Access-Control-Allow-Origin` header                |
| Old version still showing  | Browser/CDN cache not invalidated | Clear cache: `CloudFront invalidation`, `Shift+Refresh` |
| Asset 404 errors           | Asset path mismatch               | Check VITE base URL configuration                       |
| Slow performance           | Bundle size too large             | Run `npm run build`, check gzip size                    |
| TypeScript errors in build | Type generation failed            | Run `npm run generate:api`                              |
| Node modules issues        | Lockfile out of sync              | Delete node_modules, run `npm ci`                       |

### Emergency Rollback

```bash
# Immediate rollback to last known-good version
git log --oneline | head -5

# Revert to previous commit
git revert HEAD
git push origin main

# Redeploy from CI/CD
# (Automatic trigger on push)

# Verify old version is live
curl https://dashboard.example.com
```

---

## Performance Optimization

### Cache Strategy

```bash
# Static assets (CSS, JS): 1 year (immutable)
# HTML: No cache (always fresh)
# API responses: Handled by TanStack Query

# CloudFront cache behavior:
# /assets/* -> TTL: 31536000 (1 year)
# /index.html -> TTL: 0 (no cache)
```

### Code Splitting

```bash
# Vite automatically splits large bundles
# DashboardPage is lazy-loaded (~15 KB gzipped)

# Verify in browser DevTools:
# Network → JS files → check sizes
```

### Image Optimization

```bash
# Use WebP with JPEG fallback
# <img srcset="image.webp, image.jpg" />

# Lazy load images (future enhancement)
# <img loading="lazy" ... />
```

---

## Success Criteria

✅ **Deployment is successful when:**

- [x] Application loads in <3 seconds on 3G
- [x] All API requests complete <200ms
- [x] Error rate <0.1% (99.9% uptime)
- [x] No console errors
- [x] Lighthouse score >90
- [x] Security headers present
- [x] SSL/TLS certificate valid
- [x] GDPR compliant (if required)
- [x] Accessibility audit passing (WCAG AA)
- [x] All user stories functional

---

## Support & Escalation

### Deployment Issues

For deployment issues, check:

1. CloudFormation/Terraform logs
2. CI/CD pipeline logs (GitHub Actions)
3. E-mail notifications from hosting provider
4. Application error tracking (Sentry)

### Contacts

- **DevOps Team**: devops@example.com
- **Incident Response**: incidents@example.com
- **Security**: security@example.com

---

**Last Deployed**: [Date]  
**Deployed By**: [Team]  
**Status**: ✅ Live in Production
