import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { dummyStore, SharedRide } from '../dummy-store';

@Controller('api/shared-rides')
export class SimpleSharedRidesController {
  @Post('create')
  async createSharedRide(@Body() body: any): Promise<{ data: SharedRide }> {
    const ride = dummyStore.createSharedRide(
      body.driverId,
      body.pickups,
      body.drops,
      body.baseCost,
    );
    return { data: ride };
  }

  @Get('available')
  async getAvailableRides(@Body() body: any): Promise<{ data: SharedRide[] }> {
    const rides = dummyStore.getAvailableSharedRides(body.lat, body.lng, body.radiusKm);
    return { data: rides };
  }

  @Post('join')
  async joinRide(@Body() body: any): Promise<{ data: SharedRide | null }> {
    const ride = dummyStore.joinSharedRide(
      body.rideId,
      body.parentPhone,
      body.childName,
      body.pickupLat,
      body.pickupLng,
    );
    return { data: ride };
  }

  @Get(':rideId')
  async getRideDetails(@Param('rideId') rideId: string): Promise<{ data: SharedRide | null }> {
    const ride = dummyStore.getSharedRideDetails(rideId);
    return { data: ride };
  }

  @Post('start')
  async startRide(@Body() body: any): Promise<{ data: SharedRide | null }> {
    const ride = dummyStore.startSharedRide(body.rideId);
    return { data: ride };
  }

  @Post('complete')
  async completeRide(@Body() body: any): Promise<{ data: SharedRide | null }> {
    const ride = dummyStore.completeSharedRide(body.rideId);
    return { data: ride };
  }
}
