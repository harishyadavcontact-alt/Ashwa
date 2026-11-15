import { Module } from '@nestjs/common';
import { SharedRidesService } from './shared-rides.service';
import { SharedRidesController } from './shared-rides.controller';

@Module({
  controllers: [SharedRidesController],
  providers: [SharedRidesService],
  exports: [SharedRidesService],
})
export class SharedRidesModule {}
