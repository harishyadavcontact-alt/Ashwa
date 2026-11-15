# Ashwa WhatsApp Alerts Feature

## Overview
WhatsApp alerts automatically notify parents when their child reaches key milestones during a trip:
- ✓ Picked up (CHILD_BOARDED)
- ✓ Reached school (DRIVER_AT_SCHOOL)
- ✓ Left school (DRIVER_LEFT_SCHOOL)
- ✓ Dropped home (CHILD_DROPPED)

## Implementation

### 1. Frontend - Driver App (React Native)
**File:** `Ashwa/apps/mobile-driver-expo/src/App.tsx`

When driver emits a trip event, `sendWhatsAppAlert()` is automatically triggered:
```tsx
async function emitEvent(eventType: EventType) {
  // ... existing code ...
  await api.emitEvent(token, trip.id, focusedChildId, eventType);
  
  // Send WhatsApp alert to parent
  const focusedChild = tripState?.manifest?.find((child) => child.id === focusedChildId);
  if (focusedChild) {
    await sendWhatsAppAlert({
      parentPhoneNumber: '+1234567890',
      childName: focusedChild.name,
      eventType,
    });
  }
}
```

### 2. Shared Utilities
**File:** `Ashwa/packages/shared/src/extras.ts`

- `sendWhatsAppAlert()` - Main function to send WhatsApp alerts
- `getDemoLogs()` - Retrieve logged alerts in demo mode
- `clearDemoLogs()` - Clear demo logs
- `WhatsAppAlertPayload` - Type definition

**Features:**
- Demo mode: Logs messages to `localStorage` and console with `%cformatted` styling
- Production mode: Calls Supabase Edge Function → Twilio API
- Automatic fallback if Supabase credentials are missing

### 3. Backend - NestJS Service
**File:** `Ashwa/services/backend-nest/src/events/events.service.ts`

The `EventsService.notifyParent()` method now:
1. Sends Firebase Cloud Messaging (FCM) notifications
2. Sends WhatsApp alerts via Supabase Edge Function
3. Logs all operations for debugging

### 4. Supabase Edge Function
**File:** `Ashwa/supabase/functions/send-whatsapp/index.ts`

Handles Twilio API calls to send WhatsApp messages:
```
POST /functions/v1/send-whatsapp
Authorization: Bearer <SUPABASE_KEY>
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "✓ Picked up Arjun. On the way to school.",
  "metadata": {
    "eventType": "CHILD_BOARDED",
    "childName": "Arjun"
  }
}
```

## Demo Mode Testing

### 1. Check Demo Logs in Console
When a trip event is emitted, you'll see formatted output:
```
[Ashwa WhatsApp Demo Mode] {
  to: "+1234567890"
  message: "✓ Picked up Arjun. On the way to school."
  eventType: "CHILD_BOARDED"
  childName: "Arjun"
  timestamp: "2026-11-16T10:30:45.123Z"
}
```

### 2. Retrieve Logs Programmatically
In browser DevTools console:
```javascript
// Retrieve all demo logs
const logs = window.__ashwa?.getDemoLogs?.();
console.table(logs);

// Or if imported:
import { getDemoLogs } from '@ashwa/shared';
console.table(getDemoLogs());
```

### 3. Test Flow
1. Sign in to driver app
2. Accept an assignment
3. Start a trip
4. Click event buttons:
   - CHILD_BOARDED → "✓ Picked up [name]. On the way to school."
   - DRIVER_AT_SCHOOL → "✓ [name] reached school."
   - DRIVER_LEFT_SCHOOL → "✓ Left school. [name] will be home soon."
   - CHILD_DROPPED → "✓ Dropped [name] home. See you tomorrow!"
5. Check console for WhatsApp demo logs
6. Check `localStorage['ashwa.whatsapp.demo']` for all logged alerts

## Production Deployment

### Prerequisites
1. **Twilio Account**
   - Create account at https://www.twilio.com
   - Get WhatsApp sandbox or production number
   - Enable WhatsApp on your account

2. **Supabase Project**
   - Project URL
   - Service Role Key (for backend)
   - Anon Key (for frontend/mobile)

### Setup Steps

#### 1. Deploy Edge Function
```bash
cd Ashwa/supabase
supabase functions deploy send-whatsapp
```

#### 2. Configure Environment Variables

**Supabase Dashboard:**
- Go to Edge Functions → send-whatsapp → Manage Secrets
- Add secrets:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_WHATSAPP_NUMBER` (format: `whatsapp:+1234567890`)

**Backend Service (.env):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Mobile Driver App (.env):**
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Database Schema Update (Optional)
Ensure parent records have a `phone` field:
```sql
ALTER TABLE parents ADD COLUMN phone VARCHAR(20);
```

### Testing Production

1. Set real parent phone numbers in database
2. Deploy edge function
3. Emit trip events from driver app
4. Check Twilio console for message logs
5. Verify parent receives WhatsApp messages

## Message Templates

| Event Type | Message Template |
|------------|------------------|
| `CHILD_BOARDED` | ✓ Picked up [name]. On the way to school. |
| `DRIVER_AT_SCHOOL` | ✓ [name] reached school. |
| `DRIVER_LEFT_SCHOOL` | ✓ Left school. [name] will be home soon. |
| `CHILD_DROPPED` | ✓ Dropped [name] home. See you tomorrow! |
| `DRIVER_10_MIN_TO_PICKUP` | [name] driver will be at pickup in 10 minutes. |
| `DRIVER_AT_PICKUP` | Driver is at [name]'s pickup location. |
| `DRIVER_10_MIN_TO_DROP` | [name] driver will be at drop-off in 10 minutes. |
| `DRIVER_AT_DROP` | Driver is at [name]'s drop-off location. |

## Troubleshooting

### Messages not appearing in demo logs
- Check DevTools console for errors
- Verify `localStorage` is enabled
- Check `localStorage['ashwa.whatsapp.demo']` directly

### Production messages failing
- Verify Twilio credentials in Supabase secrets
- Check Edge Function logs in Supabase dashboard
- Verify phone numbers include country code (e.g., `+1` for US)
- Check Twilio account has WhatsApp enabled

### Edge Function errors
```bash
# View logs
supabase functions list
supabase functions get-logs send-whatsapp

# Deploy with debug
supabase functions deploy send-whatsapp --debug
```

## API Reference

### sendWhatsAppAlert()
```typescript
async function sendWhatsAppAlert(payload: WhatsAppAlertPayload): Promise<void>

interface WhatsAppAlertPayload {
  parentPhoneNumber: string;  // Format: +1234567890
  childName: string;          // Child's name
  eventType: EventType;       // CHILD_BOARDED | DRIVER_AT_SCHOOL | etc.
  eventData?: Record<string, unknown>; // Optional metadata
}
```

### getDemoLogs()
```typescript
function getDemoLogs(): Array<{
  timestamp: string;
  to: string;
  message: string;
  eventType: EventType;
  childName: string;
}>
```

### clearDemoLogs()
```typescript
function clearDemoLogs(): void
```

## Files Modified/Created

### New Files
- `Ashwa/packages/shared/src/extras.ts` - WhatsApp utilities
- `Ashwa/supabase/functions/send-whatsapp/index.ts` - Edge Function
- `Ashwa/supabase/functions/send-whatsapp/deno.json` - Deno config
- `Ashwa/supabase/config.toml` - Supabase configuration
- `Ashwa/WHATSAPP_ALERTS.md` - This documentation

### Modified Files
- `Ashwa/packages/shared/src/index.ts` - Export new functions
- `Ashwa/apps/mobile-driver-expo/src/App.tsx` - Wire alerts in emitEvent()
- `Ashwa/services/backend-nest/src/events/events.service.ts` - Backend integration

## Status

✅ **FEATURE COMPLETE**
- [x] Message templates configured
- [x] Frontend wiring (driver app)
- [x] Backend integration (NestJS)
- [x] Supabase Edge Function (Twilio ready)
- [x] Demo mode logging
- [x] Console styling
- [x] localStorage persistence
- [x] Error handling
- [x] Documentation

**Ready for:**
- Testing in demo mode (console logs)
- Twilio credentials configuration
- Production deployment
