# Vazifa.online Domain Deployment Guide

This guide provides step-by-step instructions for deploying the Vazifa project to your domain `https://vazifa.online`.

## Domain Configuration Summary

- **Frontend Domain**: `https://vazifa.online`
- **Backend API Domain**: `https://api.vazifa.online`
- **Project**: Vazifa Pro Management System

## 1. DNS Configuration

Configure your DNS records for `vazifa.online`:

```
A Record: vazifa.online → Your server IP
A Record: api.vazifa.online → Your server IP (or different server for API)
CNAME: www.vazifa.online → vazifa.online
```

## 2. Frontend Deployment

### Environment Variables for Production:
```env
VITE_API_URL=https://api.vazifa.online/api-v1
VITE_PRODUCTION_API_URL=https://api.vazifa.online/api-v1
VITE_DOMAIN=https://vazifa.online
VITE_APP_CLOUDINARY_CLOUD_NAME=dlvubqfkj
VITE_APP_CLOUDINARY_UPLOAD_PRESET=da121806-44c2-4a62-8ca1-5af331bc8d38
```

### Build Commands:
```bash
cd frontend
npm install
npm run build
```

### Deploy to `https://vazifa.online`:
- Upload the `dist` folder contents to your web server
- Configure your web server to serve the React app
- Set up SSL certificate for HTTPS

## 3. Backend Deployment

### Environment Variables for Production:
```env
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://vazifa.online
PRODUCTION_FRONTEND_URL=https://vazifa.online
BACKEND_URL=https://api.vazifa.online
PRODUCTION_BACKEND_URL=https://api.vazifa.online

# Database
MONGODB_URI=your_production_mongodb_uri

# JWT
JWT_SECRET=your_production_jwt_secret

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_email@vazifa.online

# Security (Arcjet)
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=production

# Cloudinary
CLOUDINARY_CLOUD_NAME=dlvubqfkj
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Deploy to `https://api.vazifa.online`:
```bash
cd backend
npm install
npm start
```

## 4. CORS Configuration

The backend is already configured to accept requests from:
- `https://vazifa.online`
- `https://www.vazifa.online`
- `https://vazifa.online/`
- `https://www.vazifa.online/`

## 5. File Upload Configuration

Files will be served from:
- **Development**: `http://localhost:5001/uploads/`
- **Production**: `https://api.vazifa.online/uploads/`

Ensure the uploads directory has proper permissions:
```bash
mkdir -p uploads
chmod 755 uploads
```

## 6. SSL Certificate Setup

### Using Let's Encrypt (Recommended):
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d vazifa.online -d www.vazifa.online -d api.vazifa.online
```

## 7. Nginx Configuration Example

```nginx
# Frontend (vazifa.online)
server {
    listen 80;
    listen 443 ssl;
    server_name vazifa.online www.vazifa.online;
    
    ssl_certificate /etc/letsencrypt/live/vazifa.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vazifa.online/privkey.pem;
    
    root /var/www/vazifa-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API (api.vazifa.online)
server {
    listen 80;
    listen 443 ssl;
    server_name api.vazifa.online;
    
    ssl_certificate /etc/letsencrypt/live/vazifa.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vazifa.online/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 8. PM2 Configuration for Backend

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'vazifa-api',
    script: 'index.js',
    cwd: './backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 9. Testing Deployment

### Test API Endpoint:
```bash
curl https://api.vazifa.online/
```

Expected response should include:
```json
{
  "domain": "https://vazifa.online",
  "api": "https://api.vazifa.online"
}
```

### Test Frontend:
Visit `https://vazifa.online` and verify:
- ✅ Site loads correctly
- ✅ API calls work
- ✅ File uploads work
- ✅ Authentication works

## 10. Security Checklist

- ✅ SSL certificates configured
- ✅ CORS properly configured
- ✅ Security headers enabled
- ✅ File upload restrictions in place
- ✅ Environment variables secured
- ✅ Database connection secured
- ✅ Arcjet security enabled

## 11. Monitoring

Set up monitoring for:
- Server uptime
- API response times
- Database connections
- File upload functionality
- SSL certificate expiration

## 12. Backup Strategy

- Database backups (MongoDB)
- Uploaded files backup
- Environment configuration backup
- SSL certificates backup

---

## Quick Deployment Commands

### Frontend:
```bash
cd frontend
npm install
npm run build
# Upload dist/ to https://vazifa.online
```

### Backend:
```bash
cd backend
npm install
NODE_ENV=production npm start
# Or use PM2 for production
```

## Support

For any deployment issues, check:
1. DNS propagation
2. SSL certificate validity
3. Server logs
4. CORS configuration
5. Environment variables

Your Vazifa project is now configured for deployment to `https://vazifa.online`!
