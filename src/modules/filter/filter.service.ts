import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { MailService } from 'modules/mail/mail.service';
import { Token } from 'modules/token/token.interface';
import { TokenService } from 'modules/token/token.service';
import { UserService } from 'modules/user/user.service';
import { FilterDto } from './dto/filter.dto';
import { SaveFilterDto } from './dto/save-filter.dto';
import { Filter } from './filter.interface';
import { FilterRepository } from './filter.repository';

@Injectable()
export class FilterService {
  constructor(
    @InjectRepository(FilterRepository)
    private readonly filterRepository: FilterRepository,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  async createFilterAndSendVerificationMail(
    saveFilterDto: SaveFilterDto,
  ): Promise<void> {
    const { email, ...filter } = saveFilterDto;

    const user = await this.userService.getVerifiedUserOrCreateNewUser(email);

    const newFilter: Filter = {
      ...filter,
      userId: user.id,
      isActive: false,
      isVerified: false,
    };
    const savedFilter = await this.filterRepository.saveFilter(newFilter);

    const token = await this.tokenService.createAndSaveToken({
      filterId: savedFilter.id,
      userId: user.id,
    });
    await this.mailService.sendFilterVerificationMail(email, token.value);
  }

  async deactivateFilterByToken(token: string): Promise<void> {
    const validToken = await this.tokenService.getValidToken(token);

    await this.filterRepository.deactivateFilter(validToken.filterId);
    await this.tokenService.deleteToken(validToken.id);
  }

  async createTokenAndDeactivationUrl(
    token: Partial<Token>,
    expirationHours: number,
  ): Promise<string> {
    const deactivationToken = await this.tokenService.createAndSaveToken(
      token,
      expirationHours,
    );

    return `${process.env.CLIENT_URL}/filters/deactivation/${deactivationToken.value}`;
  }

  async getFilterListBySubscriptionName(
    subscriptionName: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Filter>> {
    return this.filterRepository.getFilterListBySubscriptionName(
      subscriptionName,
      paginationParams,
    );
  }

  getInitialFilter = (filter: FilterDto): FilterDto => ({
    ...filter,
    pageNumber: 1,
  });

  async verifyFilter(token: string): Promise<void> {
    const {
      filterId,
      userId,
      id: tokenId,
    } = await this.tokenService.getValidToken(token);

    await this.verifyAndActivateFilter(filterId);
    await this.userService.verifyUser(userId);
    await this.tokenService.deleteToken(tokenId);
  }

  private async verifyAndActivateFilter(id: string): Promise<void> {
    const filter = await this.filterRepository.findUnverifiedFilter(id);

    return this.filterRepository.verifyAndActivateFilter(filter);
  }
}
