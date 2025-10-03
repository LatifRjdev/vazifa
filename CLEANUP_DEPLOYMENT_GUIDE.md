# Database Cleanup & Permission Restrictions Deployment Guide

## Summary of Changes

This deployment includes:
1. **Permission Restrictions**: Members can no longer edit task title, description, or assignees (only admins/managers/super_admins)
2. **Database Cleanup Script**: Deletes specified users and all tasks
3. **Workspace/Project Routes Removed**: Backend no longer serves workspace/project endpoints

## Files Modified

### Backend Files
- `backend/controllers/task-controller.js` - Added permission checks to updateTaskTitle and updateTaskDescription
- `backend/routes/index.js` - Removed workspace and project route imports
- `backend/cleanup-database.js` - New script to clean up database

## Manual Deployment Steps

### Step 1: Commit and Push Changes (Already Done)
```bash
git add .
git commit -m "Add permission restrictions and database cleanup"
git push origin main
```

### Step 2: Deploy to Production Server

SSH into your server (use the appropriate credentials):
```bash
ssh root@165.232.65.247
# OR
ssh -p 3022 ubuntu@193.111.11.98
```

### Step 3: Pull Latest Changes
```bash
cd /root/vazifa  # or /var/www/vazifa depending on your setup
git pull origin main
```

### Step 4: Run Database Cleanup Script

⚠️ **WARNING**: This will permanently delete users and tasks!

```bash
cd backend
node cleanup-database.js
```

The script will:
- Show you which users will be kept:
  - Ахматов Фируз
  - firatjk@gmail.com
  - All admins, super_admins, and managers
- Show you which users will be deleted
- Wait 5 seconds before deletion (you can Ctrl+C to cancel)
- Delete all tasks
- Clean up related data (notifications, workspace invites, etc.)
- Delete all workspaces and projects

### Step 5: Restart Backend Service
```bash
pm2 restart vazifa-backend
pm2 save
```

### Step 6: Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check backend logs
pm2 logs vazifa-backend --lines 20
```

### Step 7: Test the Changes

1. **Test Permission Restrictions**:
   - Log in as a member (non-admin/manager)
   - Try to edit a task title or description
   - Should see "Access Denied" message

2. **Test Database Cleanup**:
   - Verify only specified users remain
   - Verify all tasks are deleted
   - Check that the application still works

## Alternative: Run Cleanup Script Locally (Not Recommended)

If you need to test the cleanup script locally (not recommended for production):

```bash
# Make sure you have the correct MONGODB_URI in backend/.env
cd backend
node cleanup-database.js
```

## Rollback Plan

If something goes wrong:

1. **Restore Database from Backup** (if you have one):
   ```bash
   mongorestore --uri="your-mongodb-uri" --drop /path/to/backup
   ```

2. **Revert Code Changes**:
   ```bash
   git log  # Find the commit hash before these changes
   git checkout <previous-commit-hash>
   pm2 restart vazifa-backend
   ```

## Verification Checklist

After deployment, verify:
- [ ] Backend service is running (`pm2 status`)
- [ ] No errors in backend logs (`pm2 logs vazifa-backend`)
- [ ] Members cannot edit task titles/descriptions/assignees
- [ ] Admins/managers can still edit tasks
- [ ] Only specified users remain in database
- [ ] All tasks have been deleted
- [ ] Application is accessible and functional

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs vazifa-backend`
2. Check MongoDB connection
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed: `npm install`

## Notes

- The cleanup script will create a summary showing how many users/tasks were deleted
- Workspace and project functionality is removed but models remain (for potential future use)
- All related data (comments, responses, notifications, etc.) is cleaned up automatically
