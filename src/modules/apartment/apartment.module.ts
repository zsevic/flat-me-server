import { Module } from '@nestjs/common';
import { ApartmentController } from './apartment.controller';
import { ApartmentService } from './services';

@Module({
  providers: [ApartmentService],
  controllers: [ApartmentController],
})
export class ApartmentModule {}
