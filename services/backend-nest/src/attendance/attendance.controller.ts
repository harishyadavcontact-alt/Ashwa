import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

@Controller('api/attendance')
export class AttendanceController {
  // Log attendance for a driver
  @Post('log')
  async logAttendance(
    @Body() body: {
      driverId: string;
      date: string; // YYYY-MM-DD
      attended: boolean;
      tripsCompleted: number;
      onTimePercentage: number;
    }
  ) {
    try {
      const record = dummyStore.logAttendance(
        body.driverId,
        body.date,
        body.attended,
        body.tripsCompleted,
        body.onTimePercentage
      );
      return { success: true, record };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get attendance records for a driver
  @Get(':driverId')
  async getAttendanceForDriver(@Param('driverId') driverId: string) {
    try {
      const records = dummyStore.getAttendanceForDriver(driverId);
      const percentage = dummyStore.getAttendancePercentage(driverId);
      return { success: true, records, attendancePercentage: percentage };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get attendance percentage for a driver
  @Get(':driverId/percentage')
  async getAttendancePercentage(@Param('driverId') driverId: string) {
    try {
      const percentage = dummyStore.getAttendancePercentage(driverId);
      return { success: true, percentage };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
