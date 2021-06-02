import { Controller, Post, Query } from '@nestjs/common';
import { SaveFilterDto } from './dto/save-filter.dto';

@Controller('filters')
export class FilterController {
  @Post()
  saveFilter(@Query() filters: SaveFilterDto) {
    console.log('filters', filters);
    return;
  }
}
