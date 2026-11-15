import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

@Controller('api/invites')
export class InvitesController {
  @Post('create')
  createInvite(@Body() body: { driverId: string }) {
    const code = dummyStore.createInvite(body.driverId);
    return { code, inviteLink: `app://invite?code=${code}` };
  }

  @Post('claim')
  claimInvite(
    @Body()
    body: {
      code: string;
      parentPhone: string;
      name: string;
      email?: string;
      childName: string;
      school: string;
      pickupLat: number;
      pickupLng: number;
      dropLat: number;
      dropLng: number;
    },
  ) {
    const parent = dummyStore.claimInvite(body.code, body.parentPhone, {
      name: body.name,
      email: body.email,
      childName: body.childName,
      school: body.school,
      pickupLat: body.pickupLat,
      pickupLng: body.pickupLng,
      dropLat: body.dropLat,
      dropLng: body.dropLng,
    });

    if (!parent) {
      return { error: 'Invalid or expired invite code', statusCode: 400 };
    }

    return {
      success: true,
      parent,
      message: `Welcome ${parent.name}! You're now linked to your driver.`,
    };
  }

  @Get('validate/:code')
  validateInvite(@Param('code') code: string) {
    return { valid: code.startsWith('ASHWA-') };
  }
}
