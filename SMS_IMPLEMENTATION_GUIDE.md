# SMS Implementation Guide - SMPP with Megafon

## Overview
This guide covers the SMS functionality implemented using SMPP protocol with Megafon's SMS gateway.

## ⚠️ Important: SMPP Server Accessibility

The Megafon SMPP server (`10.241.60.10:2775`) is on a **private network** and is **NOT accessible from localhost**. 

### Where to Test:
- ✅ **Production Server** - Deploy to your production server and test there
- ✅ **Server with VPN** - Any server connected to Megafon's network
- ✅ **Whitelisted IPs** - Servers with IP addresses whitelisted by Megafon
- ❌ **Local Machine** - Cannot connect from localhost

## Implementation Status

### ✅ Completed Components:

1. **SMPP Service** (`backend/libs/send-sms.js`)
   - Full SMPP client implementation
   - Connection management with auto-reconnect
   - UCS2 encoding for Russian/Tajik characters
   - Message splitting (70 char limit per SMS)
   - Delivery receipt handling
   - Priority-based messaging

2. **Message Queue** (`backend/libs/sms-queue.js`)
   - Redis-based Bull queue
   - Priority levels: high, normal, low
   - Automatic retry with exponential backoff
   - Queue monitoring and management

3. **SMS Logging** (`backend/models/sms-logs.js`)
   - Complete SMS activity tracking
   - Delivery status monitoring
   - Cost tracking
   - Analytics and reporting

4. **Test Script** (`backend/test-sms.js`)
   - Ready to run on production
   - Tests all message types
   - Tests message splitting
   - Tests different encodings

## Configuration

### Environment Variables (.env)

```bash
# SMPP Configuration (Megafon SMS)
SMPP_HOST=10.241.60.10
SMPP_PORT=2775
SMPP_SYSTEM_ID=Rushdie_Roh
SMPP_PASSWORD=J7PCez
SMPP_SYSTEM_TYPE=smpp
SMPP_SOURCE_ADDR=Protocol

# Redis Configuration (for SMS Queue)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Testing on Production Server

### Step 1: SSH to Production Server
```bash
ssh user@your-production-server
cd /path/to/your/project/backend
```

### Step 2: Ensure Dependencies are Installed
```bash
npm install
```

### Step 3: Check Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

If Redis is not running:
```bash
# On Ubuntu/Debian
sudo systemctl start redis-server

# On other systems
redis-server &
```

### Step 4: Run Test Script
```bash
node test-sms.js
```

### Expected Output:
```
================================================================================
📱 SMS TEST SCRIPT
================================================================================
Testing SMPP connection to Megafon...
================================================================================

✅ SMPP Connection established!

📊 Connection Status:
   Host: 10.241.60.10:2775
   System ID: Rushdie_Roh
   Source Addr: Protocol
   Connected: ✅

================================================================================

📤 TEST 1: Short message (Russian)
   Message: "Тест SMS от Protocol. Привет! 👋"
   Length: 33 characters
   ✅ Result: { success: true, messageId: '...', parts: 1 }

...

✅ ALL TESTS COMPLETED SUCCESSFULLY!
================================================================================
📱 Check your phone: +992557777509
   You should receive 4 SMS messages:
   1. Short message with emoji
   2. Russian message
   3. Tajik message
   4. Long message (multiple parts)
================================================================================
```

## Integration with Application

### Sending SMS in Your Code:

```javascript
import { sendSMS } from './libs/send-sms.js';

// Send verification code
const code = '123456';
const result = await sendSMS(
  '+992557777509',
  `Ваш код подтверждения: ${code}`,
  'high' // Priority: high, normal, or low
);

console.log('SMS sent:', result);
```

### Priority Levels:

- **high**: Verification codes, OTPs, password resets (sent immediately)
- **normal**: Task notifications, workspace invites (sent within 1 min)
- **low**: General notifications, marketing (queued, sent in batch)

## SMS Features

### Supported Encodings:
- ✅ Russian (Cyrillic) - UCS2
- ✅ Tajik - UCS2
- ✅ Emoji - UCS2
- ✅ English - GSM 7-bit

### Message Length:
- **Short messages**: Up to 70 characters (UCS2)
- **Long messages**: Automatically split into multiple parts
- **Multi-part**: Properly concatenated on recipient's device

### Delivery Tracking:
- Real-time delivery receipts
- Status updates in database
- Failed message tracking
- Retry mechanisms

## Monitoring & Troubleshooting

### Check SMPP Connection Status:
```javascript
import getSMPPService from './libs/send-sms.js';

const service = getSMPPService();
const status = service.getStatus();
console.log('SMPP Status:', status);
```

### Check Queue Status:
```javascript
import { getQueueStats } from './libs/sms-queue.js';

const stats = await getQueueStats();
console.log('Queue Stats:', stats);
// Output: { waiting: 0, active: 0, completed: 10, failed: 0, delayed: 0 }
```

### View SMS Logs:
```javascript
import SMSLog from './models/sms-logs.js';

// Get recent SMS
const recentSMS = await SMSLog.find()
  .sort({ createdAt: -1 })
  .limit(10);

// Get statistics
const stats = await SMSLog.getStats(
  new Date('2024-01-01'),
  new Date()
);
console.log('SMS Stats:', stats);
```

## Common Issues & Solutions

### Issue 1: Cannot Connect to SMPP Server
**Solution**: 
- Ensure you're running on production server
- Check if server IP is whitelisted by Megafon
- Verify credentials are correct
- Check firewall rules

### Issue 2: Messages Not Sending
**Solution**:
- Check SMPP connection: `service.getStatus()`
- Check queue: `getQueueStats()`
- Review SMS logs: `SMSLog.getRecentFailures()`
- Check Redis is running: `redis-cli ping`

### Issue 3: Delivery Failures
**Solution**:
- Verify phone number format: `+992XXXXXXXXX`
- Check SMS logs for error messages
- Verify sender ID is registered: "Protocol"
- Contact Megafon support if persistent

## Cost Estimation

Based on typical SMS pricing in Tajikistan:
- **Single SMS (≤70 chars)**: ~0.05-0.10 TJS
- **Multi-part SMS (>70 chars)**: Multiple × single price

The system tracks estimated costs in the SMS logs.

## Next Steps

1. ✅ Deploy to production server
2. ✅ Run test script on production
3. ✅ Verify SMS delivery to test number
4. ⏳ Implement phone authentication
5. ⏳ Implement SMS notifications
6. ⏳ Add user SMS preferences

## Support

For issues with:
- **SMPP Connection**: Contact Megafon technical support
- **Code Issues**: Review logs and error messages
- **Network Issues**: Check server connectivity and firewall rules

## Security Notes

- ✅ SMPP credentials stored in environment variables
- ✅ Rate limiting implemented (3 SMS per hour per phone)
- ✅ Phone number validation (+992 format)
- ✅ All messages logged with delivery tracking
- ✅ Message queue for reliability

## Production Deployment Checklist

- [ ] Copy `.env.example` to `.env` and fill in values
- [ ] Ensure Redis is installed and running
- [ ] Test SMPP connection from production server
- [ ] Send test SMS to your number
- [ ] Monitor SMS logs and delivery receipts
- [ ] Set up alerts for failed deliveries
- [ ] Configure backup notification methods
