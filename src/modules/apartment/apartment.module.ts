import { HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApartmentController } from './apartment.controller';
import { ApartmentRepository } from './apartment.repository';
import { Apartment, ApartmentSchema } from './apartment.schema';
import { ApartmentService } from './apartment.service';
import { BaseProvider } from './providers';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Apartment.name,
        useFactory: () => {
          const schema = ApartmentSchema;
          schema.post('save', function(next) {
            return next();
          });
          return schema;
        },
      },
    ]),
    HttpModule,
  ],
  providers: [ApartmentRepository, ApartmentService, BaseProvider],
  controllers: [ApartmentController],
  exports: [ApartmentService],
})
export class ApartmentModule {}
