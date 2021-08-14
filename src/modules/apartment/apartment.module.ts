import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApartmentController } from './apartment.controller';
import { ApartmentRepository } from './apartment.repository';
import { Apartment, ApartmentSchema } from './apartment.schema';
import { ApartmentService } from './apartment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Apartment.name, schema: ApartmentSchema },
    ]),
  ],
  providers: [ApartmentRepository, ApartmentService],
  controllers: [ApartmentController],
  exports: [ApartmentService],
})
export class ApartmentModule {}
