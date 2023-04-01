import { Body, Controller, Param, Post } from '@nestjs/common';
import { SaveFilterDto } from './dto/save-filter.dto';
import { FilterService } from './filter.service';

@Controller('filters')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  @Post()
  async saveFilters(@Body() saveFilterDto: SaveFilterDto): Promise<void> {
    return this.filterService.createFilterAndSendVerificationMail(
      saveFilterDto,
    );
  }

  @Post('verify/:token')
  async verifyFilter(@Param('token') token: string): Promise<void> {
    return this.filterService.verifyFilter(token);
  }

  @Post('deactivate/:token')
  async deactivateFilter(@Param('token') token: string): Promise<void> {
    return this.filterService.deactivateFilterByToken(token);
  }
}
