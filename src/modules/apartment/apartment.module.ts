import { Module } from '@nestjs/common';
import { ApartmentController } from './apartment.controller';
import { ApartmentService } from './apartment.service';

@Module({
  providers: [ApartmentService],
  controllers: [ApartmentController],
})
export class ApartmentModule {}
