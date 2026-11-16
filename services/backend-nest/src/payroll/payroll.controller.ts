import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

@Controller('api/payroll')
export class PayrollController {
  @Post('process')
  async processPayroll(
    @Body() data: { assignmentId: string; amount: number },
  ) {
    const record = dummyStore.processPayroll(data.assignmentId, data.amount);
    return { success: true, record };
  }

  @Get('owner/:ownerId')
  async getPayrollForOwner(@Param('ownerId') ownerId: string) {
    const { assignments, payroll } = dummyStore.getPayrollForOwner(ownerId);

    // Enrich assignments with job details and last paid status
    const enriched = assignments.map((a) => ({
      ...a,
      lastPaid: a.lastPaidDate ? new Date(a.lastPaidDate).toLocaleDateString() : 'Not paid',
    }));

    return {
      assignments: enriched,
      payroll,
      totalMonthlyPayroll: enriched.reduce((sum, a) => sum + a.monthlyPayment, 0),
      nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  }

  @Get('driver/:driverId')
  async getEarningsForDriver(@Param('driverId') driverId: string) {
    const earnings = dummyStore.getEarningsForDriver(driverId);
    return earnings;
  }
}
