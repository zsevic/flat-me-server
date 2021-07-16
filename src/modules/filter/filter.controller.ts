import { Body, Controller, Param, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FILTER_VERIFIED } from 'common/events/constants';
import { MailService } from 'modules/mail/mail.service';
import { TokenService } from 'modules/token/token.service';
import { UserService } from 'modules/user/user.service';
import { SaveFiltersDto } from './dto/save-filters.dto';
import { FilterVerifiedEvent } from './events/filter-verified.event';
import { FilterService } from './filter.service';

@Controller('filters')
export class FilterController {
  constructor(
    private readonly eventService: EventEmitter2,
    private readonly filterService: FilterService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async saveFilters(@Body() saveFiltersDto: SaveFiltersDto): Promise<void> {
    const { email, ...filters } = saveFiltersDto;
    const user = await this.userService.validateAndGetByEmail(email);

    const token = await this.tokenService.createToken();
    const newFilter = {
      ...filters,
      userId: user._id,
      token,
      isVerified: false,
    };
    await this.filterService.saveFilters(newFilter);
    await this.mailService.sendFilterVerificationMail(email, token.value);
  }

  @Post('verify/:token')
  async verifyFilter(@Param('token') token: string): Promise<void> {
    const filter = await this.filterService.verifyFilter(token);
    const user = await this.userService.getById(filter.userId);

    const filterVerifiedEvent = new FilterVerifiedEvent();
    filterVerifiedEvent.isVerified = true;
    filterVerifiedEvent.email = user.email;
    this.eventService.emit(FILTER_VERIFIED, filterVerifiedEvent);
  }
}
