import { Body, Controller, Param, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FILTER_VERIFIED } from 'common/events/constants';
import { MailService } from 'modules/mail/mail.service';
import { TokenService } from 'modules/token/token.service';
import { UserService } from 'modules/user/user.service';
import { SaveFilterDto } from './dto/save-filter.dto';
import { FilterVerifiedEvent } from './events/filter-verified.event';
import { Filter } from './filter.interface';
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
  async saveFilters(@Body() saveFilterDto: SaveFilterDto): Promise<void> {
    const { email, ...filter } = saveFilterDto;
    const token = await this.tokenService.createToken();

    let user = await this.userService.getVerifiedUserByEmailAndValidateFilters(
      email,
    );
    if (!user) {
      user = await this.userService.saveUser(email);
      Object.assign(token, { user: user._id });
    }

    const newFilter: Filter = {
      ...filter,
      user: user._id,
      isActive: false,
      isVerified: false,
    };
    const savedFilter = await this.filterService.saveFilter(newFilter);
    await this.userService.saveFilter(user, savedFilter._id);

    Object.assign(token, { filter: savedFilter._id });
    await this.tokenService.saveToken(token);
    await this.mailService.sendFilterVerificationMail(email, token.value);
  }

  @Post('verify/:token')
  async verifyFilter(@Param('token') token: string): Promise<void> {
    const {
      filter: filterId,
      user: userId,
    } = await this.tokenService.getValidToken(token);
    const filterVerifiedEvent = new FilterVerifiedEvent();
    if (userId) {
      const user = await this.userService.verifyUser(userId);
      filterVerifiedEvent.email = user.email;
    }

    const filter = await this.filterService.verifyAndActivateFilter(filterId);
    if (!userId) {
      const user = await this.userService.getById(filter.user);
      filterVerifiedEvent.email = user.email;
    }

    filterVerifiedEvent.isVerified = true;
    this.eventService.emit(FILTER_VERIFIED, filterVerifiedEvent);
  }

  @Post('deactivate/:token')
  async deactivateFilter(@Param('token') token: string): Promise<void> {
    const validToken = await this.tokenService.getValidToken(token);

    await this.filterService.deactivateFilter(validToken.filter);
    await this.tokenService.deactivateToken(validToken);
  }
}
