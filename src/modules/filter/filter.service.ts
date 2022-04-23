import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { MailService } from 'modules/mail/mail.service';
import { TokenType } from 'modules/token/token.enums';
import { Token } from 'modules/token/token.interface';
import { TokenService } from 'modules/token/token.service';
import { Subscription } from 'modules/user/subscription.enum';
import { UserService } from 'modules/user/user.service';
import { FilterDto } from './dto/filter.dto';
import { SaveFilterDto } from './dto/save-filter.dto';
import { Filter } from './filter.interface';
import { FilterRepository } from './filter.repository';

@Injectable()
export class FilterService {
  constructor(
    private readonly filterRepository: FilterRepository,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  @Transactional()
  async createFilterAndSendVerificationMail(
    saveFilterDto: SaveFilterDto,
  ): Promise<void> {
    const { email, ...filter } = saveFilterDto;

    const user = await this.userService.getVerifiedUserOrCreateNewUser(email);

    const newFilter: Filter = {
      ...filter,
      furnished: filter.rentOrSale === 'sale' ? [] : filter.furnished,
      userId: user.id,
      isActive: false,
      isVerified: false,
    };
    const savedFilter = await this.filterRepository.saveFilter(newFilter);

    const token = await this.tokenService.createAndSaveToken({
      filterId: savedFilter.id,
      userId: user.id,
      type: TokenType.VERIFICATION,
    });
    await this.mailService.sendFilterVerificationMail(email, token.value);
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

  @Transactional()
  async deactivateFilterByToken(token: string): Promise<void> {
    const validToken = await this.tokenService.getValidToken({
      value: token,
      type: TokenType.DEACTIVATION,
    });

    await this.filterRepository.deactivateFilter(validToken.filterId);
    await this.tokenService.deleteToken(validToken.id);
  }

  async getFilterListBySubscriptionType(
    subscriptionType: Subscription,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Filter>> {
    return this.filterRepository.getFilterListBySubscriptionType(
      subscriptionType,
      paginationParams,
    );
  }

  getInitialFilter = (filter: FilterDto): FilterDto => ({
    ...filter,
    pageNumber: 1,
  });

  @Transactional()
  async verifyFilter(token: string): Promise<void> {
    const {
      filterId,
      userId,
      id: tokenId,
    } = await this.tokenService.getValidToken({
      value: token,
      type: TokenType.VERIFICATION,
    });

    await this.verifyAndActivateFilter(filterId);
    await this.userService.verifyUser(userId);
    await this.tokenService.deleteToken(tokenId);
  }

  private async verifyAndActivateFilter(id: string): Promise<void> {
    const filter = await this.filterRepository.findUnverifiedFilter(id);

    return this.filterRepository.verifyAndActivateFilter(filter);
  }
}
