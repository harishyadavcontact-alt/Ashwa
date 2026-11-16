import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { dummyStore, Service, DriverService } from '../dummy-store';

@Controller('api/services')
export class ServicesController {
  @Post('add')
  addService(
    @Body()
    body: {
      childId: string;
      type: 'school' | 'dance' | 'tuition' | 'sports' | 'medical' | 'custom';
      location: string;
      schedule: string;
      frequency: 'weekly' | 'biweekly' | 'monthly' | 'daily';
    },
  ): Service {
    // TODO: Later, validate against Supabase
    return dummyStore.addService(
      body.childId,
      body.type,
      body.location,
      body.schedule,
      body.frequency,
    );
  }

  @Get('child/:childId')
  getServicesForChild(@Param('childId') childId: string): Service[] {
    // TODO: Later, query Supabase
    return dummyStore.getServicesForChild(childId);
  }

  @Post('driver/add')
  addDriverService(
    @Body()
    body: {
      driverId: string;
      serviceType: string;
      description: string;
      areasServiced: string[];
    },
  ): DriverService {
    // TODO: Later, validate against Supabase
    return dummyStore.addDriverService(
      body.driverId,
      body.serviceType,
      body.description,
      body.areasServiced,
    );
  }

  @Get('driver/:driverId')
  getDriverServices(@Param('driverId') driverId: string): DriverService[] {
    // TODO: Later, query Supabase
    return dummyStore.getDriverServices(driverId);
  }

  @Get('available')
  getAvailableServices(
    @Query('serviceType') serviceType: string,
    @Query('location') location: string,
  ): DriverService[] {
    // TODO: Later, query Supabase
    return dummyStore.getAvailableServices(serviceType, location);
  }
}
