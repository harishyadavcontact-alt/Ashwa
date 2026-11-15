import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser, PaymentRecordInput, PaymentRecordSchema } from '@ashwa/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ReferralsService } from './referrals.service';
import { z } from 'zod';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARENT')
@Controller('referrals')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get('code')
  async getReferralCode(@CurrentUser() user: AuthUser) {
    const code = await this.referralsService.generateReferralCode(user.userId);
    return { referralCode: code };
  }

  @Post('register')
  async registerReferral(
    @CurrentUser() user: AuthUser,
    @Body() body: { referralCode: string },
  ) {
    if (!body.referralCode) {
      throw new BadRequestException('Referral code is required');
    }
    await this.referralsService.registerReferral(body.referralCode, user.userId, body.referralCode);
    return { success: true };
  }

  @Post('link-child')
  async linkChildToReferral(
    @Body() body: { childId: string; referralCode: string },
  ) {
    if (!body.childId || !body.referralCode) {
      throw new BadRequestException('childId and referralCode are required');
    }
    await this.referralsService.linkChildToReferral(body.childId, body.referralCode);
    return { success: true };
  }

  @Post('record-payment')
  @UsePipes(new ZodValidationPipe(PaymentRecordSchema))
  async recordPayment(
    @CurrentUser() user: AuthUser,
    @Body() body: PaymentRecordInput,
  ) {
    // Verify the child belongs to the user
    // This would be done in a proper implementation with authorization checks
    await this.referralsService.recordPayment(
      body.childId,
      body.month,
      body.year,
      body.amount,
      body.status,
    );
    return { success: true };
  }

  @Get('stats')
  async getReferralStats(@CurrentUser() user: AuthUser) {
    const stats = await this.referralsService.getParentReferralStats(user.userId);
    return stats;
  }

  @Get('earnings')
  async getMyEarnings(@CurrentUser() user: AuthUser) {
    const earnings = await this.referralsService.getMyReferralEarnings(user.userId);
    return { totalEarnings: earnings };
  }
}
