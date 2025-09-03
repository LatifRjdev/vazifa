# API Migration to https://ptapi.oci.tj

This document outlines all the changes made to migrate from the local backend to the external API endpoint `https://ptapi.oci.tj`.

## Summary of Changes

The application has been updated to use `https://ptapi.oci.tj/api-v1` as the backend API endpoint instead of the local development server.

## Files Modified

### 1. Frontend Configuration
**File:** `frontend/.env`

**Changes Made:**
- Updated `VITE_API_URL` from `http://localhost:5001/api-v1` to `https://ptapi.oci.tj/api-v1`
- Updated `VITE_PRODUCTION_API_URL` from `https://api.vazifa.online/api-v1` to `https://ptapi.oci.tj/api-v1`

**Before:**
```env
VITE_API_URL=http://localhost:5001/api-v1
VITE_PRODUCTION_API_URL=https://api.vazifa.online/api-v1
```

**After:**
```env
VITE_API_URL=https://ptapi.oci.tj/api-v1
VITE_PRODUCTION_API_URL=https://ptapi.oci.tj/api-v1
```

### 2. Mobile App Configuration
**File:** `mobile/VazifaMobile/src/services/api.ts`

**Changes Made:**
- Updated `API_BASE_URL` from `http://localhost:5001/api-v1` to `https://ptapi.oci.tj/api-v1`

**Before:**
```typescript
const API_BASE_URL = 'http://localhost:5001/api-v1';
```

**After:**
```typescript
const API_BASE_URL = 'https://ptapi.oci.tj/api-v1';
```

## Impact Analysis

### Frontend Application
- The frontend React/Remix application will now make all API calls to `https://ptapi.oci.tj/api-v1`
- All existing API endpoints remain the same, only the base URL has changed
- The `fetch-utils.ts` file automatically uses the environment variable, so no additional changes needed

### Mobile Application
- The React Native mobile app will now connect to `https://ptapi.oci.tj/api-v1`
- All authentication, task management, and user management APIs will use the new endpoint
- Existing API structure and authentication flow remain unchanged

## API Endpoints Affected

All API endpoints will now use the new base URL. The main endpoints include:

### Authentication
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`

### User Management
- `GET /users/profile`
- `PUT /users/profile`
- `GET /users/all`

### Task Management
- `GET /tasks/my-tasks`
- `GET /tasks/all-tasks`
- `GET /tasks/:id`
- `POST /tasks`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`
- `PATCH /tasks/:id/status`

### Additional Features
- Admin chat functionality
- File uploads
- Notifications
- Comments and responses
- Workspace management
- Organization management

## Next Steps

1. **Test the Integration**: Verify that the external API at `https://ptapi.oci.tj` is accessible and responds correctly
2. **Update CORS Settings**: Ensure the external API allows requests from your frontend domain
3. **Authentication**: Verify that the authentication flow works with the new API
4. **Environment Variables**: Consider creating separate environment files for different deployment stages if needed

## Rollback Instructions

If you need to revert to the local backend:

1. **Frontend**: Change `VITE_API_URL` back to `http://localhost:5001/api-v1` in `frontend/.env`
2. **Mobile**: Change `API_BASE_URL` back to `http://localhost:5001/api-v1` in `mobile/VazifaMobile/src/services/api.ts`

## Notes

- The local backend code in the `backend/` folder is still intact and can be used for development or as a reference
- Make sure the external API supports all the endpoints your application uses
- Consider implementing proper error handling for network connectivity issues
- Monitor API response times and implement appropriate timeout settings if needed
