import { Body, Controller, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from 'modules/user/user.service';
import { SaveFiltersDto } from './dto/save-filters.dto';
import { Filters } from './filter.schema';
import { FilterService } from './filter.service';

@Controller('filters')
export class FilterController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly filterService: FilterService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async saveFilters(@Body() saveFiltersDto: SaveFiltersDto): Promise<Filters> {
    const { email, ...filters } = saveFiltersDto;
    const user = await this.userService.validateAndGetByEmail(email);

    const newFilter = {
      ...filters,
      user_id: user._id,
    };
    return this.filterService.saveFilters(newFilter);
  }
}
