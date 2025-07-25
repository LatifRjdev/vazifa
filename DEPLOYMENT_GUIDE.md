# Vazifa Deployment Guide for Hostinger

This guide will help you deploy your Vazifa application to Hostinger hosting.

## Prerequisites

- Hostinger hosting account with Node.js support
- Domain name configured
- FTP/SFTP access to your hosting account
- Basic knowledge of file management

## Deployment Steps

### Step 1: Prepare Your Project

1. **Run the deployment script locally:**
   ```bash
   ./deploy.sh
   ```
   This will install dependencies and build the frontend.

2. **Verify environment files:**
   - `backend/.env` - Contains production database and API keys
   - `frontend/.env.production` - Contains production API URLs

### Step 2: Upload Files to Hostinger

#### Option A: Using File Manager (Recommended for beginners)

1. **Login to Hostinger Control Panel**
2. **Go to File Manager**
3. **Upload Backend:**
   - Create a folder called `api` in your root directory
   - Upload the entire `backend` folder contents to `/api/`
   - Make sure `.env` file is uploaded

4. **Upload Frontend:**
   - Build the frontend first: `cd frontend && npm run build`
   - Upload the contents of `frontend/build/client/` to `public_html/`
   - Note: The `frontend/build/server/` files are not needed for this deployment setup

#### Option B: Using FTP/SFTP

1. **Connect to your hosting via FTP/SFTP**
2. **Upload structure:**
   ```
   /
   ├── public_html/          (Frontend static files from build/client)
   │   ├── assets/
   │   ├── index.html
   │   └── ...
   └── api/                  (Backend API files)
       ├── controllers/
       ├── models/
       ├── routes/
       ├── index.js
       ├── package.json
       ├── .env
       └── ...
   ```

### Step 3: Configure Node.js Application

1. **In Hostinger Control Panel:**
   - Go to "Websites" → Select your domain
   - Look for "Node.js" in the sidebar or under "Advanced" section
   - If you don't see Node.js option, contact Hostinger support to enable it for your plan

2. **Create Node.js Application:**
   - Click "Set up" or "Create" next to Node.js
   - Or look for "Node.js Apps" and click "Create Application"

3. **Application Settings:**
   - **Application Root:** `/api` (or `api` without leading slash)
   - **Application URL:** `api.vazifa.online` (create this subdomain first)
   - **Application Startup File:** `index.js`
   - **Node.js Version:** Select 18.x or 20.x (latest available)

4. **Environment Variables:**
   In the Node.js app settings, add these environment variables:
   ```
   NODE_ENV=production
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=https://vazifa.online
   SENDGRID_API_KEY=your_sendgrid_key
   SENDGRID_FROM_EMAIL=your_email
   ARCJET_KEY=your_arcjet_key
   ARCJET_ENV=production
   ```

**Note:** If you cannot find the Node.js option:
- Check if your hosting plan supports Node.js (Business plan or higher usually required)
- Contact Hostinger support to enable Node.js for your account
- Consider upgrading your plan if necessary

**Alternative Method (if Node.js interface is different):**
1. Go to your domain management in Hostinger
2. Look for "Subdomains" and create `api.vazifa.online`
3. In File Manager, navigate to the `api` folder you created
4. Look for a `.htaccess` file or create one with:
   ```
   DirectoryIndex index.js
   ```
5. Contact Hostinger support for specific Node.js setup instructions for your account

### Step 4: Configure Domain and Subdomains

1. **Main Domain (vazifa.online):**
   - Point to `public_html/` (frontend)
   - Enable SSL certificate

2. **API Subdomain (api.vazifa.online):**
   - Create subdomain in Hostinger
   - Point to your Node.js application
   - Enable SSL certificate

### Step 5: Database Configuration

1. **MongoDB Atlas (Recommended):**
   - Your connection string is already configured
   - Make sure to whitelist Hostinger's IP addresses
   - Or use `0.0.0.0/0` for all IPs (less secure)

2. **Connection String Format:**
   ```
   mongodb://username:password@host:port/database?options
   ```

### Step 6: SSL Configuration

1. **Enable SSL for both domains:**
   - Main domain: `https://vazifa.online`
   - API subdomain: `https://api.vazifa.online`

2. **Update CORS settings** if needed in `backend/index.js`

### Step 7: Testing Deployment

1. **Test API endpoints:**
   ```bash
   curl https://api.vazifa.online/
   curl https://api.vazifa.online/api-v1/auth/health
   ```

2. **Test Frontend:**
   - Visit `https://vazifa.online`
   - Check browser console for errors
   - Test login/signup functionality

### Step 8: Monitoring and Maintenance

1. **Check logs regularly:**
   - Hostinger Control Panel → Node.js → Your App → Logs

2. **Monitor performance:**
   - Use Hostinger's built-in monitoring tools
   - Set up uptime monitoring

## Troubleshooting

### Common Issues:

1. **"Cannot connect to API"**
   - Check if Node.js app is running
   - Verify environment variables
   - Check CORS configuration

2. **Database connection errors**
   - Verify MongoDB connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure network access is configured

3. **SSL certificate issues**
   - Wait 24-48 hours for SSL propagation
   - Check domain DNS settings
   - Verify SSL is enabled in Hostinger

4. **File upload issues**
   - Check file permissions (755 for directories, 644 for files)
   - Verify .env file is uploaded and readable
   - Check Node.js app startup file path

### Performance Optimization:

1. **Enable Gzip compression** in Hostinger
2. **Use CDN** for static assets
3. **Optimize images** and assets
4. **Enable caching** headers

## Security Checklist

- [ ] SSL certificates enabled for both domains
- [ ] Environment variables properly set
- [ ] Database access restricted to necessary IPs
- [ ] API rate limiting enabled (Arcjet)
- [ ] Security headers configured
- [ ] Regular backups scheduled

## Support

If you encounter issues:

1. Check Hostinger documentation
2. Contact Hostinger support
3. Review application logs
4. Check MongoDB Atlas logs

## File Structure After Deployment

```
Hostinger File System:
/
├── public_html/              # Frontend (https://vazifa.online)
│   ├── assets/
│   ├── index.html
│   └── static files...
├── api/                      # Backend API (https://api.vazifa.online)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── libs/
│   ├── middleware/
│   ├── index.js             # Main server file
│   ├── package.json
│   ├── .env                 # Production environment
│   └── node_modules/
└── logs/                    # Application logs
```

## Environment Variables Reference

### Backend (.env)
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret
FRONTEND_URL=https://vazifa.online
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=your@email.com
ARCJET_KEY=ajkey_...
ARCJET_ENV=production
```

### Frontend (.env.production)
```env
VITE_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_APP_CLOUDINARY_UPLOAD_PRESET=your_preset
VITE_API_URL=https://api.vazifa.online/api-v1
```

## Quick Deployment Checklist

- [ ] Run `./deploy.sh` locally
- [ ] Upload backend files to `/api/` directory
- [ ] Upload frontend build to `public_html/`
- [ ] Configure Node.js app in Hostinger
- [ ] Set environment variables
- [ ] Configure domains and SSL
- [ ] Test API endpoints
- [ ] Test frontend functionality
- [ ] Monitor logs for errors

## Post-Deployment Tasks

1. **Set up monitoring:**
   - Configure uptime monitoring
   - Set up error alerts
   - Monitor database performance

2. **Backup strategy:**
   - Regular database backups
   - Code repository backups
   - Environment configuration backups

3. **Performance monitoring:**
   - Monitor response times
   - Track user analytics
   - Monitor server resources

## Maintenance

- **Regular updates:** Keep dependencies updated
- **Security patches:** Apply security updates promptly
- **Database maintenance:** Regular cleanup and optimization
- **Log rotation:** Manage log file sizes
- **SSL renewal:** Monitor certificate expiration

---

**🎉 Your Vazifa application is now production-ready and deployed on Hostinger!**

For support or questions, refer to the troubleshooting section or contact your hosting provider.
