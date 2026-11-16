import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { dummyStore, DriverProfile, SeatRequest } from '../dummy-store';

@Controller('api/discovery')
export class DiscoveryController {
  // Search drivers by school and location
  @Get('search')
  searchDrivers(
    @Query('school') school: string,
    @Query('pickupLat') pickupLat: number,
    @Query('pickupLng') pickupLng: number,
    @Query('distanceKm') distanceKm?: number,
  ): DriverProfile[] {
    // TODO: Later, replace dummyStore with Supabase geospatial query
    return dummyStore.searchDrivers(school, parseFloat(pickupLat as any), parseFloat(pickupLng as any), distanceKm || 2);
  }

  // Get driver profile and reviews
  @Get('drivers/:driverId')
  getDriverProfile(@Param('driverId') driverId: string): DriverProfile | null {
    // TODO: Later, fetch from Supabase drivers table
    return dummyStore.getDriverProfile(driverId);
  }

  // Parent sends a seat request to driver
  @Post('requests/send')
  sendSeatRequest(
    @Body()
    data: {
      parentPhone: string;
      driverId: string;
      childName: string;
      school: string;
      pickupLat: number;
      pickupLng: number;
      dropLat: number;
      dropLng: number;
    },
  ): SeatRequest {
    // TODO: Later, insert into Supabase seat_requests table
    return dummyStore.sendSeatRequest(
      data.parentPhone,
      data.driverId,
      data.childName,
      data.school,
      data.pickupLat,
      data.pickupLng,
      data.dropLat,
      data.dropLng,
    );
  }

  // Driver gets incoming seat requests
  @Get('requests/driver/:driverId')
  getDriverRequests(@Param('driverId') driverId: string): SeatRequest[] {
    // TODO: Later, query from Supabase
    return dummyStore.getRequestsForDriver(driverId);
  }

  // Driver accepts seat request
  @Post('requests/:requestId/accept')
  acceptRequest(@Param('requestId') requestId: string): SeatRequest | null {
    // TODO: Later, update Supabase + auto-link parent to driver
    return dummyStore.acceptSeatRequest(requestId);
  }

  // Driver rejects seat request
  @Post('requests/:requestId/reject')
  rejectRequest(@Param('requestId') requestId: string): SeatRequest | null {
    // TODO: Later, update Supabase
    return dummyStore.rejectSeatRequest(requestId);
  }
}
