import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

@Controller('api/attendance')
export class AttendanceController {
  @Post('log')
  logAttendance(
    @Body()
    body: {
      driverId: string;
      date: string; // YYYY-MM-DD
      attended: boolean;
      tripsCompleted: number;
      onTimePercentage: number;
      missedStops?: number;
      parentComplaints?: number;
    },
  ) {
    return dummyStore.logAttendance(
      body.driverId,
      body.date,
      body.attended,
      body.tripsCompleted,
      body.onTimePercentage,
      body.missedStops || 0,
      body.parentComplaints || 0,
    );
  }

  @Get(':driverId')
  getAttendance(@Param('driverId') driverId: string) {
    return dummyStore.getAttendance(driverId);
  }
}
