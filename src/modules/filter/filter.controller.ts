import { Body, Controller, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  FILTER_DEACTIVATION_LIMIT,
  FILTER_DEACTIVATION_TTL,
  FILTER_SAVING_LIMIT,
  FILTER_SAVING_TTL,
  FILTER_VERIFICATION_LIMIT,
  FILTER_VERIFICATION_TTL,
} from 'common/config/rate-limiter';
import { SaveFilterDto } from './dto/save-filter.dto';
import { FilterService } from './filter.service';

@Controller('filters')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  @Throttle(FILTER_SAVING_LIMIT, FILTER_SAVING_TTL)
  @Post()
  async saveFilters(@Body() saveFilterDto: SaveFilterDto): Promise<void> {
    return this.filterService.createFilterAndSendVerificationMail(
      saveFilterDto,
    );
  }

  @Throttle(FILTER_VERIFICATION_LIMIT, FILTER_VERIFICATION_TTL)
  @Post('verify/:token')
  async verifyFilter(@Param('token') token: string): Promise<void> {
    return this.filterService.verifyFilter(token);
  }

  @Throttle(FILTER_DEACTIVATION_LIMIT, FILTER_DEACTIVATION_TTL)
  @Post('deactivate/:token')
  async deactivateFilter(@Param('token') token: string): Promise<void> {
    return this.filterService.deactivateFilterByToken(token);
  }
}
