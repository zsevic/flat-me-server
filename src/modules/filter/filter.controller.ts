import { Body, Controller, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from 'modules/user/events/user-created.event';
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
    await this.userService.validateUser(email);

    const user = await this.userService.saveUser(email);
    const userCreatedEvent = new UserCreatedEvent();
    userCreatedEvent.email = email;
    userCreatedEvent.token = user.token.value;
    this.eventEmitter.emit('user.created', userCreatedEvent);

    const newFilter = {
      ...filters,
      user_id: user._id,
    };
    return this.filterService.saveFilters(newFilter);
  }
}
