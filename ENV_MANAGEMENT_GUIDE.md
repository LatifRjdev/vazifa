# Environment Variable Management Guide

This guide explains how to manage environment variables for different deployment scenarios in the Vazifa application.

## Table of Contents

1. [Overview](#overview)
2. [Environment Structure](#environment-structure)
3. [Variable Categories](#variable-categories)
4. [Deployment Scenarios](#deployment-scenarios)
5. [Security Best Practices](#security-best-practices)
6. [Environment Templates](#environment-templates)
7. [Validation and Testing](#validation-and-testing)

## Overview

The Vazifa application uses environment variables to configure different aspects of the system across various deployment environments. This guide covers how to properly manage these variables for development, staging, and production deployments.

## Environment Structure

### File Organization

```
project-root/
├── backend/
│   ├── .env                    # Development backend config
│   ├── .env.production         # Production backend config (auto-generated)
│   └── .env.example           # Backend template
├── frontend/
│   ├── .env                    # Development frontend config
│   ├── .env.production         # Production frontend config (auto-generated)
│   └── .env.example           # Frontend template
└── external-env/              # External environment configs (optional)
    ├── backend.env             # External backend production config
    ├── frontend.env            # External frontend production config
    ├── staging-backend.env     # Staging backend config
    └── staging-frontend.env    # Staging frontend config
```

### Environment Hierarchy

1. **Development**: Local `.env` files
2. **Staging**: External staging environment files
3. **Production**: External production environment files or auto-generated from development

## Variable Categories

### Backend Environment Variables

#### Server Configuration
```env
# Server settings
PORT=5001
NODE_ENV=development|staging|production

# Process management
PM2_INSTANCES=1
PM2_MAX_MEMORY=1G
```

#### Database Configuration
```env
# MongoDB connection
MONGODB_URI=mongodb://username:password@host:port/database
MONGODB_OPTIONS=retryWrites=true&w=majority

# Database pool settings (optional)
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=5
```

#### Authentication & Security
```env
# JWT configuration
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Security middleware (Arcjet)
ARCJET_KEY=ajkey_your_arcjet_key_here
ARCJET_ENV=development|production
```

#### External Services
```env
# Email service (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_TEMPLATE_ID=d-your_template_id

# File storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### OAuth Configuration
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_google_client_secret

# Apple OAuth (optional)
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret
```

#### URL Configuration
```env
# Frontend URLs
FRONTEND_URL=http://localhost:5173
PRODUCTION_FRONTEND_URL=https://yourdomain.com
VERCEL_FRONTEND_URL=https://your-app.vercel.app

# Backend URLs
BACKEND_URL=http://localhost:5001
PRODUCTION_BACKEND_URL=https://api.yourdomain.com
```

### Frontend Environment Variables

#### API Configuration
```env
# API endpoints
VITE_API_URL=http://localhost:5001/api-v1
VITE_PRODUCTION_API_URL=https://api.yourdomain.com/api-v1

# WebSocket endpoints (if applicable)
VITE_WS_URL=ws://localhost:5001
VITE_PRODUCTION_WS_URL=wss://api.yourdomain.com
```

#### External Services
```env
# Cloudinary for file uploads
VITE_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=GA-your_analytics_id
VITE_HOTJAR_ID=your_hotjar_id
```

#### Domain Configuration
```env
# Domain settings
VITE_DOMAIN=http://localhost:5173
VITE_PRODUCTION_DOMAIN=https://yourdomain.com

# Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_NOTIFICATIONS=true
```

## Deployment Scenarios

### Scenario 1: Development Environment

**Setup**: Use local `.env` files with development configurations.

```bash
# Backend .env
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/vazifa_dev

# Frontend .env
VITE_API_URL=http://localhost:5001/api-v1
VITE_DOMAIN=http://localhost:5173
```

### Scenario 2: SSH Deployment with External .env Files

**Setup**: Use external environment files for production configurations.

```bash
# Create external environment directory
mkdir production-env

# Create backend.env
cat > production-env/backend.env << 'EOF'
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://prod-user:secure-password@cluster.mongodb.net/vazifa_prod
JWT_SECRET=super_secure_production_jwt_secret_minimum_32_chars
FRONTEND_URL=https://yourdomain.com
PRODUCTION_FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
PRODUCTION_BACKEND_URL=https://api.yourdomain.com
SENDGRID_API_KEY=SG.production_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
ARCJET_KEY=ajkey_production_arcjet_key
ARCJET_ENV=production
CLOUDINARY_CLOUD_NAME=prod_cloud_name
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret
GOOGLE_CLIENT_ID=prod_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-prod_google_client_secret
EOF

# Create frontend.env
cat > production-env/frontend.env << 'EOF'
VITE_APP_CLOUDINARY_CLOUD_NAME=prod_cloud_name
VITE_APP_CLOUDINARY_UPLOAD_PRESET=prod_upload_preset
VITE_API_URL=https://api.yourdomain.com/api-v1
VITE_PRODUCTION_API_URL=https://api.yourdomain.com/api-v1
VITE_DOMAIN=https://yourdomain.com
VITE_PRODUCTION_DOMAIN=https://yourdomain.com
EOF

# Deploy using external .env files
./deploy-ssh.sh \
  --host your-server.com \
  --user deploy \
  --key ~/.ssh/id_rsa \
  --domain yourdomain.com \
  --api-domain api.yourdomain.com \
  --env-path ./production-env
```

### Scenario 3: Auto-Generated Production Environment

**Setup**: Let the deployment script automatically create production .env files from development ones.

```bash
# Deploy without external .env files
./deploy-ssh.sh \
  --host your-server.com \
  --user deploy \
  --key ~/.ssh/id_rsa \
  --domain yourdomain.com \
  --api-domain api.yourdomain.com

# The script will automatically:
# 1. Copy backend/.env to backend/.env.production
# 2. Copy frontend/.env to frontend/.env.production
# 3. Update URLs to use production domains
# 4. Set NODE_ENV=production
```

### Scenario 4: Staging Environment

**Setup**: Use separate staging environment files.

```bash
# Create staging environment files
mkdir staging-env

# Create staging backend.env
cat > staging-env/backend.env << 'EOF'
NODE_ENV=staging
PORT=5001
MONGODB_URI=mongodb://staging-user:password@staging-cluster.mongodb.net/vazifa_staging
JWT_SECRET=staging_jwt_secret_minimum_32_characters
FRONTEND_URL=https://staging.yourdomain.com
BACKEND_URL=https://api-staging.yourdomain.com
# ... other staging-specific variables
EOF

# Deploy to staging
./deploy-ssh.sh \
  --host staging-server.com \
  --user deploy \
  --domain staging.yourdomain.com \
  --api-domain api-staging.yourdomain.com \
  --env-path ./staging-env
```

## Security Best Practices

### 1. Secret Management

```bash
# Use strong, unique secrets for each environment
# Generate secure JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Use different database credentials for each environment
# Development: vazifa_dev_user
# Staging: vazifa_staging_user  
# Production: vazifa_prod_user
```

### 2. Environment Isolation

```bash
# Keep environment files separate and secure
chmod 600 production-env/*.env
chmod 600 staging-env/*.env

# Never commit .env files to version control
echo "*.env" >> .gitignore
echo "production-env/" >> .gitignore
echo "staging-env/" >> .gitignore
```

### 3. Access Control

```bash
# Limit access to environment files
# Only deployment users should have access
sudo chown deploy:deploy /var/www/vazifa/backend/.env.production
sudo chmod 600 /var/www/vazifa/backend/.env.production
```

### 4. Regular Rotation

```bash
# Rotate secrets regularly (quarterly recommended)
# Update JWT secrets
# Rotate API keys
# Update database passwords
# Regenerate OAuth secrets
```

## Environment Templates

### Backend .env Template

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://username:password@host:port/database

# JWT Configuration
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=7d

# Frontend URLs
FRONTEND_URL=http://localhost:5173
PRODUCTION_FRONTEND_URL=https://yourdomain.com

# Backend URLs
BACKEND_URL=http://localhost:5001
PRODUCTION_BACKEND_URL=https://api.yourdomain.com

# Email Configuration (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your@email.com

# Security (Arcjet)
ARCJET_KEY=ajkey_your_arcjet_key
ARCJET_ENV=development

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_google_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret
```

### Frontend .env Template

```env
# Cloudinary Configuration
VITE_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# API Configuration
VITE_API_URL=http://localhost:5001/api-v1
VITE_PRODUCTION_API_URL=https://api.yourdomain.com/api-v1

# Domain Configuration
VITE_DOMAIN=http://localhost:5173
VITE_PRODUCTION_DOMAIN=https://yourdomain.com

# Feature Flags (optional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_CHAT=true
VITE_ENABLE_NOTIFICATIONS=true

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=GA-your_analytics_id
VITE_HOTJAR_ID=your_hotjar_id
```

## Validation and Testing

### Environment Validation Script

Create `validate-env.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Required backend variables
const requiredBackendVars = [
  'PORT',
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL'
];

// Required frontend variables
const requiredFrontendVars = [
  'VITE_API_URL',
  'VITE_APP_CLOUDINARY_CLOUD_NAME',
  'VITE_DOMAIN'
];

function validateEnvFile(filePath, requiredVars, envType) {
  console.log(`\n🔍 Validating ${envType} environment file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Environment file not found: ${filePath}`);
    return false;
  }

  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};
  
  // Parse .env file
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });

  let isValid = true;
  const missingVars = [];

  // Check required variables
  requiredVars.forEach(varName => {
    if (!envVars[varName] || envVars[varName] === 'your_value_here') {
      missingVars.push(varName);
      isValid = false;
    }
  });

  if (isValid) {
    console.log(`✅ ${envType} environment validation passed`);
  } else {
    console.error(`❌ ${envType} environment validation failed`);
    console.error(`Missing or invalid variables: ${missingVars.join(', ')}`);
  }

  // Additional validations
  if (envVars.JWT_SECRET && envVars.JWT_SECRET.length < 32) {
    console.warn(`⚠️  JWT_SECRET should be at least 32 characters long`);
  }

  if (envVars.NODE_ENV === 'production' && envVars.MONGODB_URI && envVars.MONGODB_URI.includes('localhost')) {
    console.warn(`⚠️  Production environment should not use localhost MongoDB`);
  }

  return isValid;
}

// Validate environments
const backendEnvPath = process.argv[2] || 'backend/.env';
const frontendEnvPath = process.argv[3] || 'frontend/.env';

console.log('🚀 Environment Validation Tool');
console.log('================================');

const backendValid = validateEnvFile(backendEnvPath, requiredBackendVars, 'Backend');
const frontendValid = validateEnvFile(frontendEnvPath, requiredFrontendVars, 'Frontend');

if (backendValid && frontendValid) {
  console.log('\n✅ All environment validations passed!');
  process.exit(0);
} else {
  console.log('\n❌ Environment validation failed!');
  process.exit(1);
}
```

### Usage Examples

```bash
# Make validation script executable
chmod +x validate-env.js

# Validate development environment
./validate-env.js

# Validate production environment
./validate-env.js backend/.env.production frontend/.env.production

# Validate external environment files
./validate-env.js production-env/backend.env production-env/frontend.env
```

### Testing Environment Configuration

```bash
# Test backend environment loading
cd backend
node -e "
require('dotenv').config();
console.log('Environment loaded successfully');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MongoDB URI configured:', !!process.env.MONGODB_URI);
console.log('JWT Secret configured:', !!process.env.JWT_SECRET);
"

# Test MongoDB connection
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
"
```

## Environment Migration

### Migrating from Development to Production

```bash
# Create migration script
cat > migrate-env.sh << 'EOF'
#!/bin/bash

# Migrate backend environment
cp backend/.env backend/.env.backup
cp backend/.env backend/.env.production

# Update production-specific values
sed -i 's/NODE_ENV=development/NODE_ENV=production/' backend/.env.production
sed -i 's|http://localhost:5173|https://yourdomain.com|g' backend/.env.production
sed -i 's|http://localhost:5001|https://api.yourdomain.com|g' backend/.env.production

# Migrate frontend environment
cp frontend/.env frontend/.env.backup
cp frontend/.env frontend/.env.production

# Update production-specific values
sed -i 's|http://localhost:5001/api-v1|https://api.yourdomain.com/api-v1|g' frontend/.env.production
sed -i 's|http://localhost:5173|https://yourdomain.com|g' frontend/.env.production

echo "Environment migration completed"
echo "Please review and update the following:"
echo "- Database connection strings"
echo "- API keys and secrets"
echo "- OAuth credentials"
echo "- Email service configuration"
EOF

chmod +x migrate-env.sh
./migrate-env.sh
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```bash
   # Check if variables are loaded
   node -e "console.log(process.env.VARIABLE_NAME)"
   ```

2. **Wrong File Permissions**
   ```bash
   # Fix permissions
   chmod 600 .env
   chown user:group .env
   ```

3. **Environment Not Loading**
   ```bash
   # Verify file format (no spaces around =)
   # Check for special characters
   # Ensure file is in correct location
   ```

4. **Production URLs Not Working**
   ```bash
   # Verify domain configuration
   # Check DNS settings
   # Confirm SSL certificates
   ```

### Debug Commands

```bash
# Show all environment variables
printenv | grep -E "(VITE_|NODE_|MONGODB_|JWT_)"

# Test specific service connections
curl -f https://api.yourdomain.com/api-v1/auth/health

# Check PM2 environment
pm2 show vazifa-backend | grep -A 20 "Environment"
```

---

This guide provides comprehensive coverage of environment variable management for the Vazifa application across different deployment scenarios. Always follow security best practices and validate your environment configurations before deployment.
