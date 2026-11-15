/**
 * Ashwa WhatsApp Alerts
 * Sends real-time trip milestone updates to parents via WhatsApp
 */

import type { EventType } from './index';

export interface WhatsAppAlertPayload {
  parentPhoneNumber: string;
  childName: string;
  eventType: EventType;
  eventData?: Record<string, unknown>;
}

/**
 * Message templates for each trip milestone
 */
const MESSAGE_TEMPLATES: Record<EventType, (childName: string) => string> = {
  DRIVER_10_MIN_TO_PICKUP: (name) => `${name} driver will be at pickup in 10 minutes.`,
  DRIVER_AT_PICKUP: (name) => `Driver is at ${name}'s pickup location.`,
  CHILD_BOARDED: (name) => `✓ Picked up ${name}. On the way to school.`,
  DRIVER_AT_SCHOOL: (name) => `✓ ${name} reached school.`,
  DRIVER_LEFT_SCHOOL: (name) => `✓ Left school. ${name} will be home soon.`,
  DRIVER_10_MIN_TO_DROP: (name) => `${name} driver will be at drop-off in 10 minutes.`,
  DRIVER_AT_DROP: (name) => `Driver is at ${name}'s drop-off location.`,
  CHILD_DROPPED: (name) => `✓ Dropped ${name} home. See you tomorrow!`,
};

/**
 * Sends a WhatsApp alert to parent for trip milestone
 *
 * In demo mode: logs to localStorage and console
 * In production: sends via Supabase Edge Function → Twilio API
 */
export async function sendWhatsAppAlert(payload: WhatsAppAlertPayload): Promise<void> {
  const { parentPhoneNumber, childName, eventType } = payload;

  // Validate inputs
  if (!parentPhoneNumber || !childName || !eventType) {
    console.warn('WhatsApp alert: missing required fields', {
      parentPhoneNumber: !!parentPhoneNumber,
      childName: !!childName,
      eventType: !!eventType,
    });
    return;
  }

  const message = MESSAGE_TEMPLATES[eventType]?.(childName);
  if (!message) {
    console.warn(`WhatsApp alert: unknown event type: ${eventType}`);
    return;
  }

  // DEMO MODE: Log to localStorage and console
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const demoLogs = JSON.parse(localStorage.getItem('ashwa.whatsapp.demo') || '[]');
      const logEntry = {
        timestamp: new Date().toISOString(),
        to: parentPhoneNumber,
        message,
        eventType,
        childName,
      };
      demoLogs.push(logEntry);
      localStorage.setItem('ashwa.whatsapp.demo', JSON.stringify(demoLogs));

      console.log(
        '%c[Ashwa WhatsApp Demo Mode]',
        'background: #25D366; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
        {
          to: parentPhoneNumber,
          message,
          eventType,
          childName,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (e) {
      console.error('Failed to log WhatsApp demo mode', e);
    }
  }

  // PRODUCTION MODE: Call Supabase Edge Function
  try {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // Only send to production if proper env vars are set (avoid errors in demo)
    if (!supabaseUrl || !supabaseKey) {
      console.log('[Ashwa WhatsApp] Demo mode active (no Supabase credentials)');
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: parentPhoneNumber,
        message,
        metadata: {
          eventType,
          childName,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Ashwa WhatsApp] Edge Function error:', error);
    } else {
      console.log('[Ashwa WhatsApp] Message sent via Twilio');
    }
  } catch (error) {
    console.error('[Ashwa WhatsApp] Failed to send via Supabase:', error);
  }
}

/**
 * Retrieve demo mode logs (for testing/debugging)
 */
export function getDemoLogs(): any[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return JSON.parse(localStorage.getItem('ashwa.whatsapp.demo') || '[]');
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Clear demo mode logs
 */
export function clearDemoLogs(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('ashwa.whatsapp.demo');
  }
}

/**
 * Ashwa Voice Calling
 * Enables 1-tap calling between parents and drivers with Twilio forwarding
 */

export interface CallInitiateParams {
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  direction: 'PARENT_TO_DRIVER' | 'DRIVER_TO_PARENT';
  childName?: string;
}

export interface CallRecordData {
  id: string;
  callerId: string;
  receiverId: string;
  direction: 'PARENT_TO_DRIVER' | 'DRIVER_TO_PARENT';
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  twillioCallSid: string;
  status: 'INITIATED' | 'RINGING' | 'CONNECTED' | 'ENDED' | 'FAILED';
  callerName: string;
  receiverName: string;
  childName?: string;
}

/**
 * Initiates a voice call with demo mode support
 * In demo: shows "[Calling...]" → 3s pause → "[Connected]" → timer → auto-end after 10s
 * In production: would use Twilio Programmable Voice API
 */
export async function initiateCall(params: CallInitiateParams): Promise<CallRecordData> {
  const {
    callerId,
    callerName,
    receiverId,
    receiverName,
    direction,
    childName,
  } = params;

  const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date().toISOString();

  const callRecord: CallRecordData = {
    id: callId,
    callerId,
    receiverId,
    direction,
    startTime,
    durationSeconds: 0,
    twillioCallSid: `demo_${callId}`,
    status: 'INITIATED',
    callerName,
    receiverName,
    childName,
  };

  // DEMO MODE: Log to localStorage and console
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Store in active calls for UI state
      localStorage.setItem(`ashwa.call.active_${callId}`, JSON.stringify({
        ...callRecord,
        status: 'RINGING',
      }));

      console.log(
        '%c[Ashwa Call Demo Mode]',
        'background: #00a86b; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
        {
          direction,
          from: callerName,
          to: receiverName,
          child: childName || 'N/A',
          callId,
          startTime,
        }
      );

      // Simulate ringing for 3 seconds, then connected
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update to CONNECTED
      const connectedRecord: CallRecordData = {
        ...callRecord,
        status: 'CONNECTED',
      };
      localStorage.setItem(`ashwa.call.active_${callId}`, JSON.stringify(connectedRecord));

      // Simulate call duration - max 10 seconds for demo
      let elapsedSeconds = 0;
      const maxDemoSeconds = 10;

      const timerInterval = setInterval(() => {
        elapsedSeconds += 1;
        const activeRecord: CallRecordData = {
          ...callRecord,
          status: 'CONNECTED',
          durationSeconds: elapsedSeconds,
        };
        localStorage.setItem(`ashwa.call.active_${callId}`, JSON.stringify(activeRecord));

        console.log(
          `%c[Ashwa Call] ${direction === 'PARENT_TO_DRIVER' ? 'Parent → Driver' : 'Driver → Parent'}: ${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`,
          'background: #00a86b; color: white; padding: 4px 8px; border-radius: 3px;'
        );

        // Auto-end call after max demo duration
        if (elapsedSeconds >= maxDemoSeconds) {
          clearInterval(timerInterval);
          endCallDemo(callId, elapsedSeconds);
        }
      }, 1000);

      // Return initial connected record
      return connectedRecord;
    } catch (e) {
      console.error('Failed to initiate call in demo mode', e);
      const failedRecord: CallRecordData = {
        ...callRecord,
        status: 'FAILED',
        endTime: new Date().toISOString(),
      };
      return failedRecord;
    }
  }

  // PRODUCTION MODE: Call Supabase Edge Function with Twilio
  try {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // Only send to production if proper env vars are set
    if (!supabaseUrl || !supabaseKey) {
      console.log('[Ashwa Call] Demo mode active (no Supabase credentials)');
      const demoRecord: CallRecordData = {
        ...callRecord,
        status: 'RINGING',
      };
      return demoRecord;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/initiate-call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callerId,
        receiverId,
        direction,
        childName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Ashwa Call] Edge Function error:', error);
      const failedRecord: CallRecordData = {
        ...callRecord,
        status: 'FAILED',
        endTime: new Date().toISOString(),
      };
      return failedRecord;
    }

    const result = await response.json();
    console.log('[Ashwa Call] Call initiated via Twilio:', result);

    const connectedRecord: CallRecordData = {
      ...callRecord,
      twillioCallSid: result.callSid || callId,
      status: 'RINGING',
    };
    return connectedRecord;
  } catch (error) {
    console.error('[Ashwa Call] Failed to initiate call:', error);
    const failedRecord: CallRecordData = {
      ...callRecord,
      status: 'FAILED',
      endTime: new Date().toISOString(),
    };
    return failedRecord;
  }
}

/**
 * Internal demo helper to end a call
 */
function endCallDemo(callId: string, durationSeconds: number): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const activeKey = `ashwa.call.active_${callId}`;
      const activeRecord = JSON.parse(localStorage.getItem(activeKey) || '{}') as CallRecordData;

      const endedRecord: CallRecordData = {
        ...activeRecord,
        status: 'ENDED',
        endTime: new Date().toISOString(),
        durationSeconds,
      };

      // Move from active to history
      localStorage.removeItem(activeKey);
      const callHistory = JSON.parse(localStorage.getItem('ashwa.calls') || '[]') as CallRecordData[];
      callHistory.push(endedRecord);
      localStorage.setItem('ashwa.calls', JSON.stringify(callHistory));

      console.log(
        '%c[Ashwa Call Ended]',
        'background: #00a86b; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
        {
          callId,
          duration: `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}`,
          direction: endedRecord.direction,
          from: endedRecord.callerName,
          to: endedRecord.receiverName,
        }
      );

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).trackEvent) {
        (window as any).trackEvent('call_ended', {
          direction: endedRecord.direction,
          duration: durationSeconds,
          callId,
        });
      }
    } catch (e) {
      console.error('Failed to end call in demo mode', e);
    }
  }
}

/**
 * End an active call (demo or production)
 */
export function endCall(callId: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const activeKey = `ashwa.call.active_${callId}`;
      const activeRecord = JSON.parse(localStorage.getItem(activeKey) || '{}') as CallRecordData;

      if (activeRecord.id) {
        const durationSeconds = activeRecord.durationSeconds || 0;
        endCallDemo(callId, durationSeconds);
      }
    } catch (e) {
      console.error('Failed to end call', e);
    }
  }
}

/**
 * Retrieve call history (demo mode or actual records)
 */
export function getCallRecords(): CallRecordData[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return JSON.parse(localStorage.getItem('ashwa.calls') || '[]') as CallRecordData[];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Get active call for UI display
 */
export function getActiveCall(): CallRecordData | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keys = Object.keys(localStorage);
      const activeKey = keys.find(k => k.startsWith('ashwa.call.active_'));
      if (activeKey) {
        return JSON.parse(localStorage.getItem(activeKey) || 'null') as CallRecordData;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear call history
 */
export function clearCallRecords(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('ashwa.calls');
    // Clear any active calls
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('ashwa.call.active_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Emergency Alert Interface
 */
export interface EmergencyAlertPayload {
  parentPhone: string;
  driverPhone: string;
  childName: string;
  latitude: number;
  longitude: number;
}

/**
 * Sends an emergency alert to driver via WhatsApp + SMS
 *
 * In demo mode: logs to localStorage and console
 * In production: sends via Twilio WhatsApp + SMS
 */
export async function sendEmergencyAlert(payload: EmergencyAlertPayload): Promise<void> {
  const { parentPhone, driverPhone, childName, latitude, longitude } = payload;

  // Validate inputs
  if (!parentPhone || !driverPhone || !childName || latitude === undefined || longitude === undefined) {
    console.warn('Emergency alert: missing required fields', {
      parentPhone: !!parentPhone,
      driverPhone: !!driverPhone,
      childName: !!childName,
      latitude: latitude !== undefined,
      longitude: longitude !== undefined,
    });
    return;
  }

  const timestamp = new Date().toISOString();
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const message = `🚨 EMERGENCY REPORTED. Parent needs help NOW.\nChild: ${childName}\nLocation: ${mapsLink}\nTime: ${new Date().toLocaleTimeString()}`;

  // DEMO MODE: Log to localStorage and console
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const emergencyLogs = JSON.parse(localStorage.getItem('ashwa.emergency.alerts') || '[]');
      const logEntry = {
        id: `emergency_${Date.now()}`,
        timestamp,
        to: driverPhone,
        parentPhone,
        message,
        childName,
        latitude,
        longitude,
        status: 'ACTIVE',
      };
      emergencyLogs.push(logEntry);
      localStorage.setItem('ashwa.emergency.alerts', JSON.stringify(emergencyLogs));

      console.log(
        '%c[EMERGENCY]',
        'background: #dc2626; color: white; padding: 6px 10px; border-radius: 4px; font-weight: bold; font-size: 14px',
        {
          child: childName,
          message,
          coordinates: { latitude, longitude },
          mapsLink,
          timestamp: new Date().toLocaleTimeString(),
          driverPhone,
        }
      );
    } catch (e) {
      console.error('Failed to log emergency alert in demo mode', e);
    }
  }

  // PRODUCTION MODE: Call Supabase Edge Function
  try {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // Only send to production if proper env vars are set (avoid errors in demo)
    if (!supabaseUrl || !supabaseKey) {
      console.log('[Ashwa Emergency] Demo mode active (no Supabase credentials)');
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-emergency-alert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: driverPhone,
        parentPhone,
        childName,
        latitude,
        longitude,
        mapsLink,
        timestamp,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Ashwa Emergency] Edge Function error:', error);
    } else {
      console.log('[Ashwa Emergency] Alert sent to driver via Twilio');
    }
  } catch (error) {
    console.error('[Ashwa Emergency] Failed to send via Supabase:', error);
  }
}

/**
 * Retrieve emergency alerts from demo mode
 */
export function getEmergencyAlerts(): any[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return JSON.parse(localStorage.getItem('ashwa.emergency.alerts') || '[]');
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Clear emergency alerts from demo mode
 */
export function clearEmergencyAlerts(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('ashwa.emergency.alerts');
  }
}

/**
 * Send substitute driver notification to parent
 */
export interface SubstituteDriverNotificationPayload {
  parentPhoneNumber: string;
  backupDriverName: string;
  backupDriverVerified: boolean;
  childName: string;
  schoolName: string;
}

export async function sendSubstituteNotification(payload: SubstituteDriverNotificationPayload): Promise<void> {
  const { parentPhoneNumber, backupDriverName, backupDriverVerified, childName, schoolName } = payload;

  if (!parentPhoneNumber || !backupDriverName || !childName) {
    console.warn('Substitute notification: missing required fields');
    return;
  }

  const verifiedBadge = backupDriverVerified ? ' (verified)' : '';
  const message = `⚠️ Different driver today: ${backupDriverName}${verifiedBadge} will drive ${childName} to ${schoolName}. You can still track location in real-time.`;

  // DEMO MODE: Log to localStorage and console
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const demoLogs = JSON.parse(localStorage.getItem('ashwa.substitute.notifications') || '[]');
      const logEntry = {
        timestamp: new Date().toISOString(),
        to: parentPhoneNumber,
        message,
        type: 'PARENT_SUBSTITUTE_NOTIFICATION',
        backupDriverName,
        childName,
        schoolName,
      };
      demoLogs.push(logEntry);
      localStorage.setItem('ashwa.substitute.notifications', JSON.stringify(demoLogs));

      console.log(
        '%c[Substitute Driver Notification]',
        'background: #f59e0b; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
        {
          to: parentPhoneNumber,
          message,
          backupDriver: backupDriverName,
          childName,
          schoolName,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (e) {
      console.error('Failed to log substitute notification in demo mode', e);
    }
  }
}

/**
 * Send backup driver bonus notification
 */
export interface BackupBonusNotificationPayload {
  backupPhoneNumber: string;
  backupDriverName: string;
  schoolName: string;
  bonusAmount: number;
}

export async function sendBackupBonusNotification(payload: BackupBonusNotificationPayload): Promise<void> {
  const { backupPhoneNumber, backupDriverName, schoolName, bonusAmount } = payload;

  if (!backupPhoneNumber || !backupDriverName || !schoolName || !bonusAmount) {
    console.warn('Backup bonus notification: missing required fields');
    return;
  }

  const message = `✓ You're covering ${schoolName} today! Get ₹${bonusAmount} bonus for this trip.`;

  // DEMO MODE: Log to localStorage and console
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const demoLogs = JSON.parse(localStorage.getItem('ashwa.substitute.notifications') || '[]');
      const logEntry = {
        timestamp: new Date().toISOString(),
        to: backupPhoneNumber,
        message,
        type: 'BACKUP_BONUS_NOTIFICATION',
        backupDriverName,
        schoolName,
        bonusAmount,
      };
      demoLogs.push(logEntry);
      localStorage.setItem('ashwa.substitute.notifications', JSON.stringify(demoLogs));

      console.log(
        '%c[Backup Bonus Alert]',
        'background: #10b981; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
        {
          to: backupPhoneNumber,
          message,
          schoolName,
          bonus: `₹${bonusAmount}`,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (e) {
      console.error('Failed to log backup bonus notification in demo mode', e);
    }
  }
}

/**
 * Send parent refund notification (no backup found)
 */
export interface RefundNotificationPayload {
  parentPhoneNumber: string;
  childName: string;
  refundAmount: number;
  schoolName: string;
}

export async function sendRefundNotification(payload: RefundNotificationPayload): Promise<void> {
  const { parentPhoneNumber, childName, refundAmount, schoolName } = payload;

  if (!parentPhoneNumber || !childName || !refundAmount || !schoolName) {
    console.warn('Refund notification: missing required fields');
    return;
  }

  const message = `⚠️ Route unavailable today. No backup driver available for ${childName} to ${schoolName}. Refund of ₹${refundAmount} has been issued to your wallet.`;

  // DEMO MODE: Log to localStorage and console
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const demoLogs = JSON.parse(localStorage.getItem('ashwa.substitute.notifications') || '[]');
      const logEntry = {
        timestamp: new Date().toISOString(),
        to: parentPhoneNumber,
        message,
        type: 'REFUND_NOTIFICATION',
        childName,
        schoolName,
        refundAmount,
      };
      demoLogs.push(logEntry);
      localStorage.setItem('ashwa.substitute.notifications', JSON.stringify(demoLogs));

      console.log(
        '%c[Refund Issued]',
        'background: #ef4444; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
        {
          to: parentPhoneNumber,
          message,
          childName,
          schoolName,
          refund: `₹${refundAmount}`,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (e) {
      console.error('Failed to log refund notification in demo mode', e);
    }
  }
}

/**
 * Get substitute driver notifications from demo mode
 */
export function getSubstituteNotifications(): any[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return JSON.parse(localStorage.getItem('ashwa.substitute.notifications') || '[]');
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Clear substitute driver notifications from demo mode
 */
export function clearSubstituteNotifications(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('ashwa.substitute.notifications');
  }
}
