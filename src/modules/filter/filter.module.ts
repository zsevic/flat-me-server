import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'modules/mail/mail.module';
import { TokenModule } from 'modules/token/token.module';
import { UserModule } from 'modules/user/user.module';
import { FilterController } from './filter.controller';
import { FilterRepository } from './filter.repository';
import { Filter, FilterSchema } from './filter.schema';
import { FilterService } from './filter.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Filter.name, schema: FilterSchema }]),
    TypeOrmModule.forFeature([FilterRepository]),
    MailModule,
    TokenModule,
    UserModule,
  ],
  controllers: [FilterController],
  providers: [FilterRepository, FilterService],
  exports: [FilterService],
})
export class FilterModule {}
