import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ParentReferralStats, ReferralSummary, ReferralEarnings } from '@ashwa/shared';
import crypto from 'crypto';
import {
  trackReferralRegistered,
  trackChildLinkedToReferral,
  trackPaymentRecorded,
  trackReferralEarningsCredited,
} from './extras';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  // Generate a unique referral code for a parent
  async generateReferralCode(parentId: string): Promise<string> {
    // Check if parent already has a referral code
    const existing = await this.prisma.parentProfile.findUnique({
      where: { userId: parentId },
      select: { referralCode: true },
    });

    if (existing?.referralCode) {
      return existing.referralCode;
    }

    // Generate a unique code
    let code = this.generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await this.prisma.parentReferral.findUnique({
        where: { referralCode: code },
      });
      if (!exists) break;
      code = this.generateCode();
      attempts++;
    }

    // Update parent with referral code
    const parent = await this.prisma.parentProfile.update({
      where: { userId: parentId },
      data: { referralCode: code },
    });

    return parent.referralCode!;
  }

  private generateCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, 8);
  }

  // Register a referred parent
  async registerReferral(
    referrerParentId: string,
    referredParentId: string,
    referralCode: string,
  ): Promise<void> {
    // Verify referral code exists
    const referralCode_ = await this.prisma.parentProfile.findUnique({
      where: { referralCode },
      select: { userId: true },
    });

    if (!referralCode_ || referralCode_.userId !== referrerParentId) {
      throw new BadRequestException('Invalid referral code');
    }

    // Check if already referred
    const existing = await this.prisma.parentReferral.findFirst({
      where: {
        referrerParentId,
        referredParentId,
      },
    });

    if (existing) {
      throw new BadRequestException('Already referred by this parent');
    }

    // Create referral record
    await this.prisma.parentReferral.create({
      data: {
        referrerParentId,
        referredParentId,
        referralCode,
      },
    });

    // Track the event
    trackReferralRegistered(referrerParentId, referredParentId, referralCode);
  }

  // Update child's referral code when it's created/assigned to a parent
  async linkChildToReferral(childId: string, referralCode: string): Promise<void> {
    // Verify referral code exists
    const parent = await this.prisma.parentProfile.findUnique({
      where: { referralCode },
      select: { userId: true },
    });

    if (!parent) {
      throw new NotFoundException('Invalid referral code');
    }

    // Get the child to find the parent
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { parentId: true },
    });

    // Update child with referral code
    await this.prisma.child.update({
      where: { id: childId },
      data: { referralCode },
    });

    // Track the event
    if (child) {
      trackChildLinkedToReferral(childId, child.parentId, referralCode);
    }
  }

  // Record payment for a child
  async recordPayment(
    childId: string,
    month: number,
    year: number,
    amount: number = 0,
    status: 'PENDING' | 'PAID' | 'FAILED' = 'PAID',
  ): Promise<void> {
    // Get child to find parent
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { parentId: true },
    });

    const existing = await this.prisma.paymentRecord.findUnique({
      where: {
        childId_month_year: { childId, month, year },
      },
    });

    if (existing) {
      // Update existing record
      await this.prisma.paymentRecord.update({
        where: { id: existing.id },
        data: { amount, status, paidAt: status === 'PAID' ? new Date() : null },
      });
    } else {
      // Create new payment record
      await this.prisma.paymentRecord.create({
        data: {
          childId,
          month,
          year,
          amount,
          status,
          paidAt: status === 'PAID' ? new Date() : null,
        },
      });
    }

    // Track the payment
    if (child) {
      trackPaymentRecorded(childId, child.parentId, month, year, status);
    }

    // Check if this completes 3 months of payment, then auto-credit referrer
    if (status === 'PAID') {
      await this.checkAndCreditReferral(childId, month, year);
    }
  }

  // Check if child has 3 months of paid status and credit referrer
  private async checkAndCreditReferral(childId: string, month: number, year: number): Promise<void> {
    // Get child details
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { referralCode: true, parentId: true },
    });

    if (!child?.referralCode) {
      return; // Child was not referred
    }

    // Find the referral relationship
    const referral = await this.prisma.parentReferral.findFirst({
      where: { referralCode: child.referralCode },
      select: { referrerParentId: true, id: true },
    });

    if (!referral) {
      return;
    }

    // Count paid months for this child
    const paidMonths = await this.prisma.paymentRecord.count({
      where: {
        childId,
        status: 'PAID',
      },
    });

    // If 3 or more paid months, credit the referrer (only once)
    if (paidMonths >= 3) {
      const existing = await this.prisma.parentReferralEarnings.findUnique({
        where: {
          referralId_month_year: {
            referralId: referral.id,
            month,
            year,
          },
        },
      });

      if (!existing) {
        // Credit the referrer
        await this.prisma.parentReferralEarnings.create({
          data: {
            parentId: referral.referrerParentId,
            referredParentId: child.parentId,
            referralId: referral.id,
            amount: 200,
            month,
            year,
            status: 'CREDITED',
          },
        });

        // Track event
        trackReferralEarningsCredited(referral.referrerParentId, child.parentId, 200, month, year);
      }
    }
  }

  // Get referral stats for a parent
  async getParentReferralStats(parentId: string): Promise<ParentReferralStats> {
    // Get parent's referral code
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId: parentId },
      select: { referralCode: true },
    });

    if (!parent?.referralCode) {
      return {
        referralCode: '',
        totalReferrals: 0,
        totalEarnings: 0,
        potentialEarnings: 0,
        referrals: [],
        earnedHistory: [],
      };
    }

    // Get all referrals made by this parent
    const referrals = await this.prisma.parentReferral.findMany({
      where: { referrerParentId: parentId },
      include: {
        referredParent: true,
      },
    });

    // For each referral, check payment status
    const referralSummaries: ReferralSummary[] = [];
    let potentialEarnings = 0;

    for (const ref of referrals) {
      // Count paid months for referred parent's children
      const referredChildren = await this.prisma.child.findMany({
        where: { parentId: ref.referredParentId },
        select: { id: true },
      });

      let paidMonths = 0;
      for (const child of referredChildren) {
        const paid = await this.prisma.paymentRecord.count({
          where: { childId: child.id, status: 'PAID' },
        });
        paidMonths = Math.max(paidMonths, paid);
      }

      if (paidMonths < 3) {
        potentialEarnings += 200; // Potential earning if they reach 3 months
      }

      referralSummaries.push({
        id: ref.id,
        referralCode: ref.referralCode,
        referredParentId: ref.referredParentId,
        referredParentName: ref.referredParent.name,
        status: paidMonths >= 3 ? 'COMPLETED' : `${paidMonths}/3 months`,
        createdAt: ref.createdAt.toISOString(),
      });
    }

    // Get earned history
    const earnings = await this.prisma.parentReferralEarnings.findMany({
      where: { parentId },
      include: {
        referredParent: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const earnedHistory: ReferralEarnings[] = earnings.map((e) => ({
      id: e.id,
      referredParentId: e.referredParentId,
      referredParentName: e.referredParent.name,
      amount: e.amount,
      month: e.month,
      year: e.year,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    }));

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

    return {
      referralCode: parent.referralCode,
      totalReferrals: referrals.length,
      totalEarnings,
      potentialEarnings,
      referrals: referralSummaries,
      earnedHistory,
    };
  }

  // Get my referral earnings total
  async getMyReferralEarnings(parentId: string): Promise<number> {
    const result = await this.prisma.parentReferralEarnings.aggregate({
      where: { parentId },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }
}
