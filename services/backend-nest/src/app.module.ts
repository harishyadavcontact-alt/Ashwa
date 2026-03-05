import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { DriversModule } from './drivers/drivers.module';
import { ParentsModule } from './parents/parents.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { TripsModule } from './trips/trips.module';
import { TrackingModule } from './tracking/tracking.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, InstitutionsModule, DriversModule, ParentsModule, AssignmentsModule, TripsModule, TrackingModule, EventsModule, AdminModule],
  })
export class AppModule {}
