import { Body, Controller, Param, Post } from '@nestjs/common';
import { MailService } from 'modules/mail/mail.service';
import { TokenService } from 'modules/token/token.service';
import { UserService } from 'modules/user/user.service';
import { SaveFilterDto } from './dto/save-filter.dto';
import { Filter } from './filter.interface';
import { FilterService } from './filter.service';

@Controller('filters')
export class FilterController {
  constructor(
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
    }

    const newFilter: Filter = {
      ...filter,
      user: user._id,
      isActive: false,
      isVerified: false,
    };
    const savedFilter = await this.filterService.saveFilter(newFilter);
    await this.userService.saveFilter(user._id, savedFilter._id);

    Object.assign(token, { filter: savedFilter._id, user: user._id });
    await this.tokenService.saveToken(token);
    await this.mailService.sendFilterVerificationMail(email, token.value);
  }

  @Post('verify/:token')
  async verifyFilter(@Param('token') token: string): Promise<void> {
    const {
      filter: filterId,
      user: userId,
    } = await this.tokenService.getValidToken(token);

    await this.filterService.verifyAndActivateFilter(filterId);
    await this.userService.verifyUser(userId);
  }

  @Post('deactivate/:token')
  async deactivateFilter(@Param('token') token: string): Promise<void> {
    const validToken = await this.tokenService.getValidToken(token);

    await this.filterService.deactivateFilter(validToken.filter);
    await this.tokenService.deactivateToken(validToken);
  }
}
