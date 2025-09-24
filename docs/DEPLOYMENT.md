# Deployment Guide - The Blacklist

This document provides comprehensive instructions for deploying The Blacklist application to different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Automated Deployment (CI/CD)](#automated-deployment-cicd)
- [Manual Deployment](#manual-deployment)
- [Deployment Scripts](#deployment-scripts)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

1. **Node.js** (v18 or higher)
2. **npm** (comes with Node.js)
3. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```
4. **Git** (for version control)

### Firebase Setup

1. **Login to Firebase**
   ```bash
   firebase login
   ```

2. **Verify project access**
   ```bash
   firebase projects:list
   ```

3. **Set default project**
   ```bash
   firebase use the-blacklist-879f1
   ```

## Environment Configuration

### Environment Files

The project uses different environment files for each deployment target:

- `.env` - Development (local)
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Required Environment Variables

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Application Configuration
VITE_APP_NAME="The Blacklist"
VITE_APP_VERSION="1.0.0"
VITE_APP_ENVIRONMENT="production"
VITE_APP_DEBUG="false"
VITE_APP_LOG_LEVEL="error"

# Feature Flags
VITE_FEATURE_ANALYTICS="true"
VITE_FEATURE_ERROR_REPORTING="true"
VITE_FEATURE_PERFORMANCE_MONITORING="true"
```

### GitHub Secrets

For automated deployments, configure these secrets in your GitHub repository:

#### Production Secrets
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_TOKEN`

#### Staging Secrets (if different)
- `STAGING_FIREBASE_API_KEY`
- `STAGING_FIREBASE_AUTH_DOMAIN`
- `STAGING_FIREBASE_PROJECT_ID`
- `STAGING_FIREBASE_STORAGE_BUCKET`
- `STAGING_FIREBASE_MESSAGING_SENDER_ID`
- `STAGING_FIREBASE_APP_ID`
- `STAGING_FIREBASE_MEASUREMENT_ID`
- `FIREBASE_SERVICE_ACCOUNT_STAGING`

## Automated Deployment (CI/CD)

### Automatic Deployments

The CI/CD pipeline automatically deploys:

- **Staging**: When code is pushed to `develop` branch
- **Production**: When code is pushed to `main` branch

### Pipeline Stages

1. **Lint and Type Check**
   - ESLint validation
   - TypeScript type checking

2. **Testing**
   - Unit tests
   - Integration tests
   - Security tests
   - Coverage reporting

3. **E2E Testing**
   - Cypress end-to-end tests
   - Cross-browser testing

4. **Performance Testing**
   - Lighthouse audits
   - Web Vitals measurement
   - Bundle size analysis

5. **Deployment**
   - Build optimization
   - Firebase Hosting deployment
   - Cloud Functions deployment

6. **Post-Deployment**
   - Health checks
   - Performance monitoring
   - Error tracking

### Manual Trigger

You can manually trigger deployments using GitHub Actions:

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Select "Manual Deployment" workflow
4. Click "Run workflow"
5. Choose environment and options
6. Click "Run workflow"

## Manual Deployment

### Using Deployment Script

The easiest way to deploy manually:

```bash
# Deploy to staging
node scripts/deploy.js staging

# Deploy to production
node scripts/deploy.js production

# Deploy with options
node scripts/deploy.js production --skip-tests --skip-functions
```

### Available Options

- `--skip-tests` - Skip running tests
- `--skip-functions` - Skip Cloud Functions deployment
- `--skip-firestore` - Skip Firestore rules deployment
- `--skip-health-check` - Skip post-deployment health check

### Step-by-Step Manual Deployment

#### 1. Prepare Environment

```bash
# Install dependencies
npm ci

# Run tests
npm run test:all

# Type check
npm run type-check
```

#### 2. Build Application

```bash
# For staging
npm run build:staging

# For production
npm run build:production
```

#### 3. Deploy to Firebase

```bash
# Deploy hosting only
firebase deploy --only hosting:production

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting,functions,firestore
```

#### 4. Verify Deployment

```bash
# Run health check
node scripts/health-check.js production

# Run Lighthouse audit
npm run lighthouse:production
```

## Deployment Scripts

### Available Scripts

```bash
# Build scripts
npm run build:staging          # Build for staging
npm run build:production       # Build for production
npm run build:optimized        # Optimized production build with asset optimization
npm run build:analyze          # Build with bundle analysis

# Deployment scripts
npm run deploy:staging         # Deploy to staging
npm run deploy:production      # Deploy to production
npm run deploy:functions       # Deploy Cloud Functions only
npm run deploy:all            # Deploy everything

# Testing scripts
npm run test:all              # Run all tests
npm run test:e2e              # Run E2E tests
npm run test:performance      # Run performance tests
npm run test:security         # Run security tests

# Environment scripts
npm run env:validate          # Validate environment configuration
npm run env:template          # Generate environment template
npm run env:secrets           # Check for exposed secrets

# Monitoring scripts
npm run health-check:production    # Check production health
npm run lighthouse:production      # Audit production performance
npm run monitor:production         # Comprehensive production monitoring

# Optimization scripts
npm run optimize:assets       # Optimize built assets
npm run bundle:analyze        # Analyze bundle size
```

### Custom Scripts

#### Health Check Script

```bash
node scripts/health-check.js [environment]
```

Checks:
- Main page accessibility
- Service Worker availability
- PWA Manifest validity
- API endpoints (if applicable)

#### Deployment Script

```bash
node scripts/deploy.js [environment] [options]
```

Features:
- Prerequisites validation
- Automated testing
- Build optimization
- Deployment execution
- Health verification

## Monitoring and Health Checks

### Performance Monitoring

The application includes built-in performance monitoring:

- **Web Vitals**: CLS, FID, FCP, LCP, TTFB
- **Custom Metrics**: Load times, resource usage
- **Firebase Performance**: Automatic trace collection
- **Real User Monitoring**: Production performance data

### Health Checks

Automated health checks verify:

- Application availability
- Service Worker functionality
- PWA manifest validity
- Critical user flows
- Performance thresholds

### Monitoring Dashboard

Access monitoring data through:

- Firebase Console (Performance tab)
- Google Analytics (if configured)
- Lighthouse CI reports
- GitHub Actions artifacts

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Clear cache and reinstall
npm run clean:install

# Check TypeScript errors
npm run type-check

# Verify environment variables
cat .env.production
```

#### 2. Deployment Failures

```bash
# Check Firebase authentication
firebase login --reauth

# Verify project configuration
firebase projects:list
firebase use --add

# Check deployment targets
firebase target:apply hosting production the-blacklist-879f1
```

#### 3. Performance Issues

```bash
# Analyze bundle size
npm run bundle:analyze

# Run performance audit
npm run performance:audit

# Check Lighthouse scores
npm run lighthouse:ci
```

#### 4. Environment Variable Issues

```bash
# Verify environment file exists
ls -la .env*

# Check variable loading
echo $VITE_FIREBASE_PROJECT_ID

# Validate Firebase configuration
firebase projects:list
```

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# Set debug environment variables
export VITE_APP_DEBUG=true
export VITE_APP_LOG_LEVEL=debug

# Build with debug info
npm run build:staging
```

### Getting Help

1. Check the [Firebase documentation](https://firebase.google.com/docs)
2. Review GitHub Actions logs
3. Check Firebase Console for errors
4. Verify environment configuration
5. Run health checks and performance audits

### Emergency Rollback

If a deployment causes issues:

```bash
# Rollback to previous version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID

# Or deploy previous commit
git checkout [previous-commit-hash]
node scripts/deploy.js production --skip-tests
```

## Security Considerations

- Never commit environment files with real credentials
- Use GitHub Secrets for sensitive data
- Regularly rotate Firebase service account keys
- Monitor deployment logs for sensitive information
- Use HTTPS for all production deployments
- Enable Firebase Security Rules
- Implement Content Security Policy (CSP)

## Performance Optimization

- Enable gzip compression
- Use CDN for static assets
- Implement proper caching headers
- Optimize images and fonts
- Use code splitting and lazy loading
- Monitor Core Web Vitals
- Regular Lighthouse audits