# SMTP Email Configuration Guide

This guide explains how to configure SMTP email functionality for the Vazifa application.

## Overview

The application uses SMTP (Simple Mail Transfer Protocol) to send emails for:
- User email verification
- Password reset requests
- 2FA verification codes
- Workspace invitations
- Task notifications

## Environment Variables

Add the following variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=172.16.55.75
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=your-from-email
SMTP_FROM_NAME=Your-App-Name
```

### Configuration Details

- **SMTP_HOST**: Your SMTP server hostname or IP address
- **SMTP_PORT**: SMTP server port (587 for STARTTLS, 465 for SSL)
- **SMTP_SECURE**: Set to `true` for SSL (port 465), `false` for STARTTLS (port 587)
- **SMTP_USER**: Username for SMTP authentication
- **SMTP_PASS**: Password for SMTP authentication
- **SMTP_FROM_EMAIL**: Email address that appears as sender
- **SMTP_FROM_NAME**: Display name that appears as sender

## Features

### Automatic Fallback
The system automatically tries port 465 with SSL if port 587 fails.

### Connection Pooling
Uses connection pooling for better performance and reliability.

### Retry Logic
Automatically retries failed email sends up to 3 times with exponential backoff.

### Error Handling
Comprehensive error logging and handling for troubleshooting.

## Testing

### Test SMTP Configuration
Run the test script to verify your SMTP setup:

```bash
cd backend
node test-smtp.js
```

This will:
1. Display your SMTP configuration (without sensitive data)
2. Send a test email to the configured sender address
3. Provide troubleshooting tips if the test fails

### Test Email Functions
Test specific email functions:

```bash
# Test email verification
node test-email-verification.js
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check if your SMTP server is accessible
   - Verify firewall settings allow SMTP traffic
   - Ensure correct hostname/IP address

2. **Authentication Failed**
   - Verify username and password are correct
   - Check if your SMTP server requires specific authentication methods

3. **Port Issues**
   - Try port 587 with STARTTLS (SMTP_SECURE=false)
   - Try port 465 with SSL (SMTP_SECURE=true)
   - Check if your network blocks these ports

4. **SSL/TLS Issues**
   - For self-signed certificates, the system automatically accepts them
   - Ensure your SMTP server supports the chosen encryption method

### Debug Mode
Enable detailed logging by checking the console output when sending emails. The system provides comprehensive error messages and retry information.

## Security Considerations

- Store SMTP credentials securely in environment variables
- Use strong passwords for SMTP authentication
- Consider using app-specific passwords if available
- Regularly rotate SMTP credentials
- Monitor email sending logs for suspicious activity

## Email Templates

The system uses HTML email templates located in:
```
backend/template/email-template.html
```

Template variables:
- `{{name}}` - Recipient's name
- `{{message}}` - Email message content
- `{{buttonText}}` - Call-to-action button text
- `{{buttonLink}}` - Call-to-action button URL
- `{{year}}` - Current year

## Migration from SendGrid

If migrating from SendGrid:
1. Update environment variables as shown above
2. Remove old SendGrid variables
3. Test email functionality
4. Update any deployment scripts

The `sendEmail()` function signature remains the same, ensuring compatibility with existing code.

## Production Deployment

For production environments:
1. Use secure SMTP credentials
2. Configure proper DNS records (SPF, DKIM, DMARC)
3. Monitor email delivery rates
4. Set up email bounce handling
5. Consider using a dedicated SMTP service for high volume

## Support

For issues with SMTP configuration:
1. Check the console logs for detailed error messages
2. Run the test script to diagnose problems
3. Verify network connectivity to your SMTP server
4. Consult your SMTP provider's documentation
