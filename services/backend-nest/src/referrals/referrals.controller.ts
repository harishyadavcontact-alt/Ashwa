import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

@Controller('api/referrals')
export class ReferralsController {
  @Post('send')
  sendReferral(
    @Body()
    body: {
      parentPhone: string;
      sentToPhone?: string; // optional: phone that was shared to
    },
  ) {
    try {
      dummyStore.logReferralSend(body.parentPhone, body.sentToPhone);
      return { success: true, message: 'Referral logged' };
    } catch (e) {
      return { error: (e as Error).message, statusCode: 400 };
    }
  }

  @Post('claim')
  claimReferral(
    @Body()
    body: {
      referralCode: string;
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
    try {
      const { parent, referrer } = dummyStore.claimReferral(body.referralCode, body.parentPhone, {
        name: body.name,
        email: body.email,
        childName: body.childName,
        school: body.school,
        pickupLat: body.pickupLat,
        pickupLng: body.pickupLng,
        dropLat: body.dropLat,
        dropLng: body.dropLng,
      });

      return {
        success: true,
        parent,
        referrer,
        message: `Welcome ${parent.name}! Your referrer ${referrer?.name} will earn ₹200.`,
      };
    } catch (e) {
      return { error: (e as Error).message, statusCode: 400 };
    }
  }

  @Get('earnings/:parentPhone')
  getEarnings(@Param('parentPhone') parentPhone: string) {
    const earnings = dummyStore.getEarnings(decodeURIComponent(parentPhone));
    return earnings;
  }

  @Get('stats/:parentPhone')
  getStats(@Param('parentPhone') parentPhone: string) {
    const stats = dummyStore.getReferralStats(decodeURIComponent(parentPhone));
    return stats;
  }

  @Get('code/:parentPhone')
  getReferralCode(@Param('parentPhone') parentPhone: string) {
    const parent = dummyStore.getParent(decodeURIComponent(parentPhone));
    if (!parent) {
      return { error: 'Parent not found', statusCode: 404 };
    }

    return {
      code: parent.referralCode,
      whatsappMessage: `I'm using Ashwa to track my child's pickup/drop. Join me! ashwa.app/join?referral=${parent.referralCode}`,
    };
  }
}
