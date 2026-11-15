# WhatsApp Alerts - Testing Guide

## Feature Completion Checklist

✅ **Implementation Complete**

### 1. Frontend Integration
- [x] Import `sendWhatsAppAlert` in driver app
- [x] Call in `emitEvent()` function when trip event occurs
- [x] Pass child name and event type
- [x] Demo phone number configured for testing

**Location:** `Ashwa/apps/mobile-driver-expo/src/App.tsx` (lines 246-265)

### 2. Utility Library
- [x] Created `extras.ts` with `sendWhatsAppAlert()` function
- [x] Message templates for all 8 event types
- [x] Demo mode logging to localStorage
- [x] Console logging with formatted styling
- [x] Helper functions: `getDemoLogs()`, `clearDemoLogs()`
- [x] Exported from shared package

**Location:** `Ashwa/packages/shared/src/extras.ts`

### 3. Backend Integration
- [x] Updated `EventsService.notifyParent()` method
- [x] Added `sendWhatsAppAlert()` integration
- [x] Message templates in backend
- [x] Phone number masking for secure logging
- [x] Error handling and logging

**Location:** `Ashwa/services/backend-nest/src/events/events.service.ts`

### 4. Supabase Edge Function
- [x] Created `send-whatsapp` edge function
- [x] Twilio API integration ready
- [x] Environment variable configuration
- [x] CORS headers
- [x] Request validation
- [x] Error responses

**Location:** `Ashwa/supabase/functions/send-whatsapp/index.ts`

### 5. Documentation
- [x] Complete feature documentation
- [x] Setup instructions
- [x] Message templates
- [x] API reference
- [x] Troubleshooting guide

**Location:** `Ashwa/WHATSAPP_ALERTS.md`

---

## Demo Mode Testing

### Test 1: Console Logging

**Steps:**
1. Open browser DevTools (F12)
2. Go to "Console" tab
3. Run driver app
4. Accept assignment
5. Start trip
6. Emit an event (e.g., CHILD_BOARDED)

**Expected Output:**
```
[Ashwa WhatsApp Demo Mode] {
  to: "+1234567890"
  message: "✓ Picked up [Child Name]. On the way to school."
  eventType: "CHILD_BOARDED"
  childName: "[Child Name]"
  timestamp: "2026-11-16T10:30:45.123Z"
}
```

### Test 2: localStorage Inspection

**Steps:**
1. In DevTools Console, run:
```javascript
JSON.parse(localStorage.getItem('ashwa.whatsapp.demo'))
```

2. Or use helper function:
```javascript
import { getDemoLogs } from '@ashwa/shared';
getDemoLogs()
```

**Expected Output:**
Array of alert objects with timestamp, to, message, eventType, childName

### Test 3: All Event Types

Emit each event and verify messages:

| Event | Expected Message |
|-------|------------------|
| DRIVER_10_MIN_TO_PICKUP | "[Name] driver will be at pickup in 10 minutes." |
| DRIVER_AT_PICKUP | "Driver is at [name]'s pickup location." |
| CHILD_BOARDED | "✓ Picked up [name]. On the way to school." |
| DRIVER_AT_SCHOOL | "✓ [name] reached school." |
| DRIVER_LEFT_SCHOOL | "✓ Left school. [name] will be home soon." |
| DRIVER_10_MIN_TO_DROP | "[Name] driver will be at drop-off in 10 minutes." |
| DRIVER_AT_DROP | "Driver is at [name]'s drop-off location." |
| CHILD_DROPPED | "✓ Dropped [name] home. See you tomorrow!" |

### Test 4: Clear Demo Logs

```javascript
import { clearDemoLogs } from '@ashwa/shared';
clearDemoLogs();
```

Then verify localStorage is cleared:
```javascript
localStorage.getItem('ashwa.whatsapp.demo') // Returns null
```

---

## Production Mode Testing (Once Deployed)

### Prerequisites
1. Twilio account with WhatsApp enabled
2. Supabase project set up
3. Edge function deployed
4. Environment variables configured

### Test Flow

1. **Configure Twilio:**
   - Get account SID and auth token
   - Get WhatsApp sandbox/production number
   - Add parent phone to test database record

2. **Deploy Edge Function:**
```bash
cd Ashwa/supabase
supabase functions deploy send-whatsapp
```

3. **Set Secrets in Supabase:**
   - Dashboard → Edge Functions → send-whatsapp → Manage Secrets
   - Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER

4. **Verify Backend Env:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
```

5. **Run Test:**
   - Emit trip event
   - Check Twilio console for message log
   - Verify parent receives WhatsApp

### Twilio Verification
Visit https://console.twilio.com/monitor/logs to see:
- Message delivery status
- Error codes (if any)
- Message content

---

## Error Scenarios

### Scenario 1: Missing Supabase Credentials (Demo Mode)
**Behavior:** Falls back to console logging only
**Message:** "[Ashwa WhatsApp] Demo mode active (no Supabase credentials)"

### Scenario 2: Invalid Phone Number
**Behavior:** Function returns early
**Logged:** "Missing required fields: 'to' and 'message'"

### Scenario 3: Edge Function Fails
**Behavior:** Logged to console error
**Check:** `mcp__Claude_Browser__preview_console_logs` for errors

### Scenario 4: Twilio API Error
**Behavior:** Response includes Twilio error details
**Check:** Twilio console for rate limits, auth issues

---

## Code Examples

### Using in React Component

```tsx
import { sendWhatsAppAlert } from '@ashwa/shared';

async function handleTripEvent() {
  await sendWhatsAppAlert({
    parentPhoneNumber: '+1234567890',
    childName: 'Arjun',
    eventType: 'CHILD_BOARDED',
  });
}
```

### Using in NestJS Service

```typescript
import { sendWhatsAppAlert } from '@ashwa/shared';

async function notifyParent() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Call is automatic in EventsService.notifyParent()
}
```

### Checking Demo Logs

```javascript
const logs = getDemoLogs();
console.table(logs);

// Filter by event type
const boarded = logs.filter(l => l.eventType === 'CHILD_BOARDED');
console.log(`Total pickups logged: ${boarded.length}`);
```

---

## Verification Checklist

### After Implementation
- [x] `sendWhatsAppAlert` imported in driver app
- [x] `emitEvent()` calls WhatsApp alert function
- [x] Demo mode logs appear in console
- [x] localStorage stores alert history
- [x] Helper functions accessible
- [x] All message templates present
- [x] Backend integration complete
- [x] Edge function code ready
- [x] Documentation comprehensive

### Before Production
- [ ] Twilio account created and WhatsApp enabled
- [ ] Test with real Twilio credentials
- [ ] Edge function deployed to Supabase
- [ ] Environment variables configured
- [ ] Parent phone numbers in database
- [ ] End-to-end WhatsApp delivery verified
- [ ] Error handling tested
- [ ] Logging configured

---

## Debugging Tips

1. **Check console for import errors:**
```javascript
typeof sendWhatsAppAlert // Should be 'function'
```

2. **Verify demo mode logging:**
```javascript
window.localStorage.getItem('ashwa.whatsapp.demo')
```

3. **Monitor event emissions:**
Open DevTools and run driver app, emit events, watch console

4. **Edge function logs:**
```bash
cd Ashwa/supabase
supabase functions get-logs send-whatsapp
```

5. **Twilio logs:**
Visit https://console.twilio.com/monitor/logs

---

## Performance Notes

- Demo mode: ~1-2ms per log (localStorage write)
- Production: ~500-1000ms per message (network + Twilio)
- No blocking: sendWhatsAppAlert is async, doesn't block UI
- Error handling: Non-critical failures logged but don't throw

---

## Files to Review

1. **`Ashwa/packages/shared/src/extras.ts`** - Core implementation
2. **`Ashwa/apps/mobile-driver-expo/src/App.tsx`** - Frontend integration (lines 246-265)
3. **`Ashwa/services/backend-nest/src/events/events.service.ts`** - Backend integration
4. **`Ashwa/supabase/functions/send-whatsapp/index.ts`** - Edge function
5. **`Ashwa/WHATSAPP_ALERTS.md`** - Complete documentation

---

## Next Steps

1. ✅ Implementation complete
2. ✅ Demo mode tested and verified
3. ⏭️ Configure Twilio credentials
4. ⏭️ Deploy Supabase edge function
5. ⏭️ Run production tests
6. ⏭️ Monitor Twilio delivery logs

Ready for deployment!
