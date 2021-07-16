import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from 'modules/mail/mail.module';
import { TokenModule } from 'modules/token/token.module';
import { UserModule } from 'modules/user/user.module';
import { FilterController } from './filter.controller';
import { Filters, FiltersSchema } from './filter.schema';
import { FilterService } from './filter.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Filters.name, schema: FiltersSchema }]),
    MailModule,
    TokenModule,
    UserModule,
  ],
  controllers: [FilterController],
  providers: [FilterService],
  exports: [FilterService],
})
export class FilterModule {}
