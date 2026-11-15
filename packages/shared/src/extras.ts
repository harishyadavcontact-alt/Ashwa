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
