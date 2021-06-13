import { Module } from '@nestjs/common';
import { ApartmentModule } from 'modules/apartment/apartment.module';
import { FilterModule } from 'modules/filter/filter.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [ApartmentModule, FilterModule],
  providers: [TasksService],
})
export class TasksModule {}
