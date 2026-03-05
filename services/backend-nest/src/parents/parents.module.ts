import { Module } from '@nestjs/common';
import { ParentsController } from './parents.controller';
@Module({ controllers: [ParentsController] })
export class ParentsModule {}
