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
import { ReferralsModule } from './referrals/referrals.module';
import { InvitesModule } from './invites/invites.module';
import { SharedRidesModule } from './shared-rides/shared-rides.module';
import { JobsModule } from './jobs/jobs.module';
import { PayrollModule } from './payroll/payroll.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoansModule } from './loans/loans.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { PrismaModule } from './prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    InstitutionsModule,
    DriversModule,
    ParentsModule,
    AssignmentsModule,
    TripsModule,
    TrackingModule,
    EventsModule,
    AdminModule,
    ReferralsModule,
    InvitesModule,
    SharedRidesModule,
    JobsModule,
    PayrollModule,
    NotificationsModule,
    LoansModule,
    DiscoveryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
