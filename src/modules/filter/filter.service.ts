import { Injectable } from '@nestjs/common';
import { MailService } from 'modules/mail/mail.service';
import { TokenService } from 'modules/token/token.service';
import { UserService } from 'modules/user/user.service';
import { FilterDto } from './dto/filter.dto';
import { SaveFilterDto } from './dto/save-filter.dto';
import { FilterRepository } from './filter.repository';
import { Filter, FilterDocument } from './filter.schema';

@Injectable()
export class FilterService {
  constructor(
    private readonly filterRepository: FilterRepository,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  async createFilterAndSendVerificationMail(
    saveFilterDto: SaveFilterDto,
  ): Promise<void> {
    const { email, ...filter } = saveFilterDto;

    const user = await this.userService.getVerifiedOrCreateNewUser(email);

    const newFilter: Filter = {
      ...filter,
      user: user._id,
      isActive: false,
      isVerified: false,
    };
    const savedFilter = await this.saveFilter(newFilter);
    await this.userService.saveFilter(user._id, savedFilter._id);

    const token = await this.tokenService.createAndSaveToken({
      filter: savedFilter._id,
      user: user._id,
    });
    await this.mailService.sendFilterVerificationMail(email, token.value);
  }

  async deactivateFilterByToken(token: string): Promise<void> {
    const validToken = await this.tokenService.getValidToken(token);

    await this.deactivateFilter(validToken.filter);
    await this.tokenService.deleteToken(validToken);
  }

  async deactivateFilter(filterId: string): Promise<void> {
    const filter = await this.filterRepository.findFilterById(filterId);

    return this.filterRepository.deactivateFilter(filter);
  }

  async getDeactivationUrl(
    filterId: string,
    expirationHours: number,
  ): Promise<string> {
    const deactivationToken = await this.tokenService.createAndSaveToken(
      { filter: filterId },
      expirationHours,
    );

    return `${process.env.CLIENT_URL}/filters/deactivation/${deactivationToken.value}`;
  }

  async getFilterListBySubscriptionName(
    subscriptionName: string,
  ): Promise<FilterDocument[]> {
    return this.filterRepository.getFilterListBySubscriptionName(
      subscriptionName,
    );
  }

  getInitialFilter = (filter: FilterDto): FilterDto => ({
    ...filter,
    pageNumber: 1,
  });

  async saveFilter(filter: Filter): Promise<Filter> {
    return this.filterRepository.saveFilter(filter);
  }

  async verifyFilter(token: string): Promise<void> {
    const {
      filter: filterId,
      user: userId,
    } = await this.tokenService.getValidToken(token);

    await this.verifyAndActivateFilter(filterId);
    await this.userService.verifyUser(userId);
  }

  private async verifyAndActivateFilter(id: string): Promise<void> {
    const filter = await this.filterRepository.findUnverifiedFilter(id);

    return this.filterRepository.verifyAndActivateFilter(filter);
  }
}
