import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import QRCode from 'qrcode';

@Controller('api/qr')
export class QrController {
  @Get('driver/:driverId')
  async getDriverQr(@Param('driverId') driverId: string, @Res() res: Response) {
    // Generate unique driver invite code
    const inviteCode = `DRIVER-${driverId.toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const deepLink = `ashwa://invite?code=${inviteCode}&driverId=${driverId}`;

    // Generate QR code as data URL
    const qrImage = await QRCode.toDataURL(deepLink);

    res.json({
      inviteCode,
      deepLink,
      qrImage, // PNG base64
      message: `Share this QR code to invite families to your van`,
    });
  }

  @Get('referral/:parentId')
  async getParentReferralQr(@Param('parentId') parentId: string, @Res() res: Response) {
    // Generate unique referral code
    const referralCode = `PARENT-${parentId.toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const deepLink = `ashwa://referral?code=${referralCode}&parentId=${parentId}`;

    // Generate QR code as data URL
    const qrImage = await QRCode.toDataURL(deepLink);

    res.json({
      referralCode,
      deepLink,
      qrImage, // PNG base64
      message: `Share this QR code to earn ₹200 per friend who joins`,
      earnings: `Earn ₹200 per family that joins and completes 3 trips`,
    });
  }

  @Get('validate/:code')
  async validateQrCode(@Param('code') code: string, @Res() res: Response) {
    // Validate invite/referral code format
    const isValid = code.startsWith('DRIVER-') || code.startsWith('PARENT-');

    res.json({
      code,
      isValid,
      type: code.startsWith('DRIVER-') ? 'invite' : code.startsWith('PARENT-') ? 'referral' : 'unknown',
    });
  }
}
