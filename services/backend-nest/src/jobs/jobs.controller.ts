import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

@Controller('api/jobs')
export class JobsController {
  @Post('create')
  async createJob(
    @Body()
    data: {
      ownerId: string;
      routeId: string;
      routeName: string;
      monthlyPayment: number;
      startDate: string; // ISO date
    },
  ) {
    const job = dummyStore.createJob(
      data.ownerId,
      data.routeId,
      data.routeName,
      data.monthlyPayment,
      new Date(data.startDate),
    );
    return { success: true, job };
  }

  @Get('owner/:ownerId')
  async getJobsForOwner(@Param('ownerId') ownerId: string) {
    const jobs = dummyStore.getJobsForOwner(ownerId);
    return { jobs };
  }

  @Post('apply')
  async applyForJob(
    @Body() data: { jobId: string; driverId: string },
  ) {
    const assignment = dummyStore.hireDriver(data.jobId, data.driverId);
    return { success: true, assignment };
  }

  @Get('driver/:driverId')
  async getJobsForDriver(@Param('driverId') driverId: string) {
    const jobs = dummyStore.getAssignmentsForDriver(driverId);
    return { jobs };
  }
}
