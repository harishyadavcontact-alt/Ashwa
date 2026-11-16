import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

@Controller('api/calls')
export class CallsController {
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
    }
  }
}
