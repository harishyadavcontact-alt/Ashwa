import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

@Controller('api/calls')
export class CallsController {
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
    }
  }
}
