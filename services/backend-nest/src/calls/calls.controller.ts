import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

@Controller('api/calls')
export class CallsController {
<<<<<<< HEAD
  @Post('initiate')
  initiateCall(
    @Body()
    body: {
      fromPhone: string;
      toPhone: string;
      fromRole: 'driver' | 'parent';
      reason?: string; // 'SOS' | 'normal'
    },
  ) {
    try {
      const call = dummyStore.initiateCall(body.fromPhone, body.toPhone, body.fromRole, body.reason);

      // TODO: Later, actually call Twilio to initiate call
      return {
        success: true,
        call,
        message: `Call initiated from ${body.fromRole} ${body.fromPhone} to ${body.toPhone}${body.reason ? ` (${body.reason})` : ''}`,
      };
    } catch (e) {
      return { error: (e as Error).message, statusCode: 400 };
    }
  }

  @Post('answer')
  answerCall(
    @Body()
    body: {
      callId: string;
    },
  ) {
    try {
      const call = dummyStore.answerCall(body.callId);
      if (!call) {
        return { error: 'Call not found', statusCode: 404 };
      }

      return {
        success: true,
        call,
        message: 'Call answered',
      };
    } catch (e) {
      return { error: (e as Error).message, statusCode: 400 };
    }
  }

  @Post('decline')
  declineCall(
    @Body()
    body: {
      callId: string;
    },
  ) {
    try {
      const call = dummyStore.declineCall(body.callId);
      if (!call) {
        return { error: 'Call not found', statusCode: 404 };
      }

      return {
        success: true,
        call,
        message: 'Call declined',
      };
    } catch (e) {
      return { error: (e as Error).message, statusCode: 400 };
    }
  }

  @Post('end')
  endCall(
    @Body()
    body: {
      callId: string;
    },
  ) {
    try {
      const call = dummyStore.endCall(body.callId);
      if (!call) {
        return { error: 'Call not found', statusCode: 404 };
      }

      return {
        success: true,
        call,
        message: `Call ended (${call.durationSeconds || 0}s)`,
      };
    } catch (e) {
      return { error: (e as Error).message, statusCode: 400 };
    }
  }

  @Get('history/:phone')
  getCallHistory(@Param('phone') phone: string) {
    try {
      const calls = dummyStore.getCallHistory(decodeURIComponent(phone));
      return {
        success: true,
        calls,
        total: calls.length,
      };
    } catch (e) {
      return { error: (e as Error).message, statusCode: 400 };
    }
  }

  @Get('incoming/:phone')
  getIncomingCall(@Param('phone') phone: string) {
    try {
      const call = dummyStore.getIncomingCall(decodeURIComponent(phone));
      return {
        success: true,
        call,
      };
    } catch (e) {
      return { error: (e as Error).message, statusCode: 400 };
=======
  // Initiate a call (parent → driver or driver → parent)
  @Post('initiate')
  async initiateCall(
    @Body() body: {
      fromPhone: string;
      fromRole: 'driver' | 'parent';
      toPhone: string;
      toRole: 'driver' | 'parent';
    }
  ) {
    try {
      // TODO: Later, extract fromPhone from JWT token
      // TODO: Later, integrate with Twilio to initiate actual call
      const call = dummyStore.initiateCall(body.fromPhone, body.fromRole, body.toPhone, body.toRole);
      return { success: true, call };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Answer a call
  @Post(':callId/answer')
  async answerCall(@Param('callId') callId: string) {
    try {
      // TODO: Later, update Twilio call state
      const call = dummyStore.answerCall(callId);
      if (!call) {
        return { success: false, error: 'Call not found' };
      }
      return { success: true, call };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // End a call
  @Post(':callId/end')
  async endCall(@Param('callId') callId: string) {
    try {
      // TODO: Later, update Supabase with call duration
      const call = dummyStore.endCall(callId);
      if (!call) {
        return { success: false, error: 'Call not found' };
      }
      return { success: true, call };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get call history for a phone number
  @Get('history/:phone')
  async getCallHistory(@Param('phone') phone: string) {
    try {
      // TODO: Later, extract phone from JWT token
      const calls = dummyStore.getCallHistory(phone);
      return { success: true, calls };
    } catch (error) {
      return { success: false, error: error.message };
>>>>>>> 1ddae88c7dc5c3c523d6b1fac916b88b22d8e023
    }
  }
}
