import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { dummyStore, Loan } from './dummy-store';

@Controller('api/loans')
export class LoansController {
  // Apply for a loan
  @Post('apply')
  async applyForLoan(
    @Body() body: { driverId: string; principal: number; downPayment: number }
  ): Promise<Loan> {
    // TODO: Later, add underwriting logic and validation
    const loan = dummyStore.applyForLoan(body.driverId, body.principal, body.downPayment);
    return loan;
  }

  // Get active loan for driver
  @Get(':driverId')
  async getLoan(@Param('driverId') driverId: string): Promise<Loan | null> {
    // TODO: Later, query Supabase for all loans (active/paid off history)
    const loan = dummyStore.getLoanForDriver(driverId);
    return loan;
  }

  // Toggle auto-deduction
  @Post(':loanId/toggle-auto-deduct')
  async toggleAutoDeduct(
    @Param('loanId') loanId: string,
    @Body() body: { autoDeduct: boolean }
  ): Promise<Loan | null> {
    // TODO: Later, update Supabase
    const loan = dummyStore.toggleAutoDeduct(loanId, body.autoDeduct);
    return loan;
  }

  // Get amortization schedule
  @Get(':loanId/schedule')
  async getLoanSchedule(@Param('loanId') loanId: string): Promise<any[]> {
    // TODO: Later, query Supabase
    const schedule = dummyStore.getLoanSchedule(loanId);
    return schedule;
  }

  // Deduct payment from earnings (called when trip ends with auto-deduct ON)
  @Post(':loanId/deduct')
  async deductPayment(
    @Param('loanId') loanId: string,
    @Body() body: { amount: number }
  ): Promise<Loan | null> {
    // TODO: Later, update Supabase and create payment_record
    const loan = dummyStore.deductFromLoan(loanId, body.amount);
    return loan;
  }
}
