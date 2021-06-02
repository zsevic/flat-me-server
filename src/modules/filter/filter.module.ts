import { Module } from '@nestjs/common';
import { FilterController } from './filter.controller';

@Module({
  controllers: [FilterController],
})
export class FilterModule {}
