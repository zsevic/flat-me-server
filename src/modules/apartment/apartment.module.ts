import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApartmentController } from './apartment.controller';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentService } from './apartment.service';
import { BaseProvider } from './providers';

@Module({
  imports: [TypeOrmModule.forFeature([ApartmentRepository])],
  providers: [ApartmentService, BaseProvider],
  controllers: [ApartmentController],
  exports: [ApartmentService],
})
export class ApartmentModule {}
