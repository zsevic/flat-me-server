import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from 'modules/user/user.service';
import { SaveFiltersDto } from './dto/save-filters.dto';
import { Filters } from './filter.schema';
import { FilterService } from './filter.service';

@Controller('filters')
export class FilterController {
  constructor(
    private readonly filterService: FilterService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async saveFilters(@Body() saveFiltersDto: SaveFiltersDto): Promise<Filters> {
    const { email, ...filters } = saveFiltersDto;
    await this.userService.validateUser(email);
    const user = await this.userService.saveUser(email);
    const newFilter = {
      ...filters,
      user_id: user._id,
    };
    return this.filterService.saveFilters(newFilter);
  }
}
