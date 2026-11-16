import { Module } from '@nestjs/common';
import { StoriesController } from './stories.controller';

@Module({
  controllers: [StoriesController],
})
export class StoriesModule {}
