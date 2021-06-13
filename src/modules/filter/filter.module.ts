import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'modules/user/user.module';
import { FilterController } from './filter.controller';
import { Filters, FiltersSchema } from './filter.schema';
import { FilterService } from './filter.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Filters.name, schema: FiltersSchema }]),
    UserModule,
  ],
  controllers: [FilterController],
  providers: [FilterService],
  exports: [FilterService],
})
export class FilterModule {}
