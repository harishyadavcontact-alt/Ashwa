import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

interface LocationUpdate {
  tripId: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: number;
}

// Simple in-memory store for current location
const tripLocations: Map<string, LocationUpdate> = new Map();

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula (returns km)
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Controller('api/trips')
export class TripsController {
  @Post('start')
  startTrip(
    @Body()
    body: {
      tripId: string;
      driverId: string;
      stops: Array<{ school: string; lat: number; lng: number }>;
    },
  ) {
    dummyStore.startTrip(body.tripId);
    return { success: true, tripId: body.tripId, message: 'Trip started' };
  }

  @Post('location')
  updateLocation(
    @Body()
    body: {
      tripId: string;
      lat: number;
      lng: number;
    },
  ) {
    tripLocations.set(body.tripId, {
      tripId: body.tripId,
      driverId: '',
      lat: body.lat,
      lng: body.lng,
      timestamp: Date.now(),
    });

    return { success: true };
  }

  @Get('eta/:tripId')
  getETA(@Param('tripId') tripId: string) {
    const trip = dummyStore.getTrip(tripId);
    if (!trip) {
      return { error: 'Trip not found', statusCode: 404 };
    }

    // Get current location
    const location = tripLocations.get(tripId);
    if (!location) {
      return {
        eta: null,
        status: 'Starting',
        message: 'Trip in progress',
        locationLastUpdated: null,
      };
    }

    // Check if location is stale (>1 min)
    const timeSinceUpdate = Date.now() - location.timestamp;
    if (timeSinceUpdate > 60000) {
      return {
        eta: null,
        status: 'En route',
        message: 'Location updated 1 min ago',
        locationLastUpdated: new Date(location.timestamp),
      };
    }

    // Find next stop
    const nextStop = trip.stops.find((s) => !s.arrivalTime);
    if (!nextStop) {
      return {
        eta: null,
        status: 'All stops completed',
        message: 'Trip complete',
        locationLastUpdated: new Date(location.timestamp),
      };
    }

    // Calculate ETA: distance / 25 km/h (city speed)
    const distanceKm = calculateDistance(location.lat, location.lng, nextStop.lat, nextStop.lng);
    const etaMinutes = Math.round(distanceKm / 25) * 60; // Convert to seconds

    return {
      eta: Math.max(1, Math.round(etaMinutes / 60)), // Return in minutes, min 1
      status: 'En route',
      nextStop: nextStop.school,
      distanceKm: distanceKm.toFixed(1),
      locationLastUpdated: new Date(location.timestamp),
    };
  }

  @Post('arrival')
  recordArrival(
    @Body()
    body: {
      tripId: string;
      stopIndex: number;
    },
  ) {
    dummyStore.recordStopArrival(body.tripId, body.stopIndex);
    return { success: true, message: 'Stop arrival recorded' };
  }

  @Post('end')
  endTrip(@Body() body: { tripId: string }) {
    dummyStore.endTrip(body.tripId);
    tripLocations.delete(body.tripId);
    return { success: true, message: 'Trip ended' };
  }
}
