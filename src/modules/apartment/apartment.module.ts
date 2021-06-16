import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApartmentController } from './apartment.controller';
import { Apartment, ApartmentSchema } from './apartment.schema';
import { ApartmentService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Apartment.name, schema: ApartmentSchema },
    ]),
  ],
  providers: [ApartmentService],
  controllers: [ApartmentController],
  exports: [ApartmentService],
})
export class ApartmentModule {}
