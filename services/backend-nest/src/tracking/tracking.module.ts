import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingGateway } from './tracking.gateway';
@Module({ controllers: [TrackingController], providers: [TrackingGateway], exports: [TrackingGateway] })
export class TrackingModule {}
