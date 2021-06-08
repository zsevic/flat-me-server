import { Body, Controller, Post } from '@nestjs/common';
import { SaveFilterDto } from './dto/save-filter.dto';

@Controller('filters')
export class FilterController {
  @Post()
  saveFilter(@Body() filters: SaveFilterDto) {
    console.log('filters', filters);
    return;
  }
}
