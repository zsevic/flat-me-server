import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilterController } from './filter.controller';
import { Filters, FiltersSchema } from './filter.schema';
import { FilterService } from './filter.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Filters.name, schema: FiltersSchema }]),
  ],
  controllers: [FilterController],
  providers: [FilterService],
})
export class FilterModule {}
