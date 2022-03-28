import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LOCKED_STATUS_CODE, TOKEN_EXPIRATION } from 'common/constants';
import { Apartment } from 'modules/apartment/apartment.interface';
import { FilterRepository } from 'modules/filter/filter.repository';
import { TokenType } from 'modules/token/token.enums';
import { TokenRepository } from 'modules/token/token.repository';
import { User } from './user.interface';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(FilterRepository)
    private readonly filterRepository: FilterRepository,
    @InjectRepository(TokenRepository)
    private readonly tokenRepository: TokenRepository,
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async getById(id: string): Promise<User> {
    return this.userRepository.getById(id);
  }

  async getVerifiedUserOrCreateNewUser(email: string): Promise<User> {
    const user = await this.getVerifiedUserByEmailAndValidateFilters(email);
    if (!user) return this.saveUser(email);

    return user;
  }

  async getUserEmail(userId: string): Promise<string> {
    return this.userRepository.getUserEmail(userId);
  }

  private async getVerifiedUserByEmailAndValidateFilters(
    email: string,
  ): Promise<User> {
    const user = await this.userRepository.getByEmail(email);
    if (!user) return;

    if (!user.isVerified) {
      const token = await this.tokenRepository.findOne(
        {
          userId: user.id,
          type: TokenType.VERIFICATION,
        },
        {
          order: {
            createdAt: 'DESC',
          },
        },
      );
      if (!token) return user;

      const tokenExpirationDifference =
        new Date().getTime() - new Date(token.createdAt).getTime();
      if (tokenExpirationDifference > TOKEN_EXPIRATION) {
        this.logger.log(
          'Token expired, removing token and unverified filters...',
        );
        await this.tokenRepository.remove(token);
        await this.filterRepository.delete({
          userId: user.id,
          isVerified: false,
        });
        return user;
      }

      throw new UnprocessableEntityException('User is not verified');
    }

    const activeFilters = user.filters.filter(filter => filter.isActive);
    if (activeFilters.length >= 1) {
      throw new HttpException(
        `Filter limit is already filled`,
        LOCKED_STATUS_CODE,
      );
    }

    return user;
  }

  async insertReceivedApartments(userId: string, apartments: Apartment[]) {
    return this.userRepository.insertReceivedApartments(userId, apartments);
  }

  async saveUser(email: string): Promise<User> {
    return this.userRepository.saveUser(email);
  }

  async verifyUser(id: string): Promise<void> {
    const user = await this.userRepository.getById(id);
    if (!user) throw new BadRequestException('User is not found');

    if (user.isVerified) return;

    await this.userRepository.verifyUser(user);
  }
}
