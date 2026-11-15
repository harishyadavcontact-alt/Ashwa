import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';

@Module({
  providers: [ReferralsService, PrismaService],
  controllers: [ReferralsController],
  exports: [ReferralsService],
})
export class ReferralsModule {}
