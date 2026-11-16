import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';

@Module({
  controllers: [LoansController],
})
export class LoansModule {}
