/**
 * Supabase Edge Function: send-whatsapp
 *
 * Sends WhatsApp messages via Twilio API
 *
 * Environment Variables:
 * - TWILIO_ACCOUNT_SID: Twilio account identifier
 * - TWILIO_AUTH_TOKEN: Twilio authentication token
 * - TWILIO_WHATSAPP_NUMBER: Twilio WhatsApp-enabled phone number (format: whatsapp:+1234567890)
 *
 * Request Body:
 * {
 *   "to": "+1234567890",
 *   "message": "Your message text",
 *   "metadata": {
 *     "eventType": "CHILD_BOARDED",
 *     "childName": "Arjun"
 *   }
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendWhatsAppRequest {
  to: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface TwilioResponse {
  status: number;
  body: {
    sid?: string;
    error?: string;
  };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    // Validate credentials
    if (!accountSid || !authToken || !twilioWhatsAppNumber) {
      return new Response(
        JSON.stringify({
          error: "Twilio credentials not configured",
          details: {
            hasAccountSid: !!accountSid,
            hasAuthToken: !!authToken,
            hasTwilioNumber: !!twilioWhatsAppNumber,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request
    const payload: SendWhatsAppRequest = await req.json();
    const { to, message, metadata } = payload;

    // Validate payload
    if (!to || !message) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: 'to' and 'message'",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format phone numbers for WhatsApp
    const recipientNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const fromNumber = twilioWhatsAppNumber.startsWith("whatsapp:")
      ? twilioWhatsAppNumber
      : `whatsapp:${twilioWhatsAppNumber}`;

    // Build Twilio API request
    const auth = btoa(`${accountSid}:${authToken}`);
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("From", fromNumber);
    formData.append("To", recipientNumber);
    formData.append("Body", message);

    // Log for debugging
    console.log(`[Ashwa WhatsApp] Sending message to ${to}`, {
      eventType: metadata?.eventType,
      childName: metadata?.childName,
      messageLength: message.length,
    });

    // Call Twilio API
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseBody = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("[Ashwa WhatsApp] Twilio error:", responseBody);
      return new Response(
        JSON.stringify({
          error: "Failed to send WhatsApp message",
          details: responseBody,
        }),
        {
          status: twilioResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[Ashwa WhatsApp] Message sent successfully", {
      sid: responseBody.sid,
      to,
      eventType: metadata?.eventType,
    });

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        messageSid: responseBody.sid,
        metadata,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Ashwa WhatsApp] Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
