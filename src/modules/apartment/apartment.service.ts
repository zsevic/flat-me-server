import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Filter } from 'modules/filter/filter.interface';
import {
  CursorPaginatedResponse,
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { NotificationSubscriptionRepository } from 'modules/subscription/notification-subscription.repository';
import { Subscription } from 'modules/user/subscription.enum';
import { UserRepository } from 'modules/user/user.repository';
import { requiredFields } from './apartment.constants';
import { Apartment, ApartmentStatus } from './apartment.interface';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';
import { FoundApartmentListParamsDto } from './dto/found-apartment-list-params.dto';
import { BaseProvider } from './providers';
import { Provider } from './providers/provider.interface';

@Injectable()
export class ApartmentService {
  private readonly logger = new Logger(ApartmentService.name);

  constructor(
    private readonly apartmentRepository: ApartmentRepository,
    private readonly notificationSubscriptionRepository: NotificationSubscriptionRepository,
    private readonly userRepository: UserRepository,
    private readonly baseProvider: BaseProvider,
  ) {}

  async deleteApartment(id): Promise<void> {
    return this.apartmentRepository.deleteApartment(id);
  }

  private async findAndSaveApartmentsFromProviders(
    providerRequests,
    filter: FilterDto,
  ) {
    const newRequests = [];

    try {
      const providerResults = await this.baseProvider.getProviderResults(
        providerRequests,
      );
      for (const [index, providerResult] of providerResults.entries()) {
        const { provider } = providerRequests[index];

        const apartments = provider.getResults(providerResult, filter) || [];
        if (apartments.length === 0) continue;

        const foundApartments = await this.getFoundApartments(
          apartments,
          provider,
        );
        if (foundApartments.length === 0) {
          continue;
        }

        try {
          this.logger.log(
            `Saving ${foundApartments.length} new apartment(s) from ${provider.providerName} for ${filter.rentOrSale}, page ${filter.pageNumber}`,
          );
          await this.apartmentRepository.saveApartmentList(foundApartments);
        } catch (error) {
          this.logger.error(error.message);
          continue;
        }

        const hasNextPage = provider.hasNextPage(
          providerResult,
          filter.pageNumber,
        );
        if (hasNextPage) {
          newRequests.push(
            provider.createRequest({
              ...filter,
              pageNumber: filter.pageNumber + 1,
            }),
          );
        }
      }

      if (newRequests.length > 0) {
        const filterWithNextPage = {
          ...filter,
          pageNumber: filter.pageNumber + 1,
        };
        return this.findAndSaveApartmentsFromProviders(
          newRequests,
          filterWithNextPage,
        );
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getApartmentListFromDatabaseByFilter(
    filter: Filter,
    limitPerPage: number,
  ) {
    const apartmentListParams = {
      ...filter,
      limitPerPage,
      pageNumber: 1,
    };
    const apartmentsIds = filter.user.apartments.map(apartment => apartment.id);

    return this.getApartmentListFromDatabase(
      apartmentListParams as ApartmentListParamsDto,
      apartmentsIds,
      filter.createdAt,
    );
  }

  async getApartmentListFromDatabase(
    filter: ApartmentListParamsDto,
    skippedApartmentments?: string[],
    dateFilter?: Date,
  ): Promise<PaginatedResponse<Apartment>> {
    return this.apartmentRepository.getApartmentList(
      filter,
      skippedApartmentments,
      dateFilter,
    );
  }

  async getApartmentsIds(
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<string>> {
    return this.apartmentRepository.getApartmentsIds(paginationParams);
  }

  getFoundApartments = async (
    apartments,
    provider: Provider,
  ): Promise<Apartment[]> => {
    const foundAparments = [];
    for (const apartment of apartments) {
      const apartmentInfo = provider.parseApartmentInfo(apartment);
      const isApartmentAlreadySaved = await this.apartmentRepository.findOne({
        id: apartmentInfo.id,
      });
      if (isApartmentAlreadySaved) {
        continue;
      }

      try {
        const apartmentData = await provider.createRequestForApartment(
          apartmentInfo.apartmentId,
          apartmentInfo.url,
        ).request;
        if (!apartmentData) continue;
        provider.updateApartmentInfo(apartmentData, apartmentInfo);

        const isValidApartmentInfo = requiredFields.every(
          field => !!apartmentInfo[field],
        );
        if (!isValidApartmentInfo) continue;

        foundAparments.push(apartmentInfo);
      } catch (error) {
        this.logger.error(error);
      }
    }
    return foundAparments;
  };

  async getFoundApartmentList(
    filter: FoundApartmentListParamsDto,
    withCurrentPrice?: boolean,
  ): Promise<CursorPaginatedResponse<Apartment>> {
    const subscription = await this.notificationSubscriptionRepository.findOne({
      where: {
        token: filter.token,
      },
    });
    if (!subscription) {
      throw new UnauthorizedException('Subscription token is not valid');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: subscription.userId,
      },
    });
    if (!user) {
      throw new InternalServerErrorException('User is not found');
    }

    return this.apartmentRepository.getFoundApartmentList(
      subscription.userId,
      filter,
      Subscription[user.subscription],
      withCurrentPrice,
    );
  }

  async getValidApartmentList(
    apartmentListParamsDto: ApartmentListParamsDto,
  ): Promise<CursorPaginatedResponse<Apartment>> {
    await this.validateApartmentListFromDatabase(apartmentListParamsDto);

    return this.apartmentRepository.getCursorPaginatedApartmentList(
      apartmentListParamsDto,
    );
  }

  async handleDeletingInactiveApartment(
    apartmentId: string,
    lastCheckedAt: Date,
    apartmentUrl?: string,
  ): Promise<string> {
    try {
      if (!this.isCheckableApartment(lastCheckedAt)) return apartmentId;

      const isApartmentInactive = await this.isApartmentInactive(
        apartmentId,
        apartmentUrl,
      );
      if (!isApartmentInactive) {
        await this.apartmentRepository.updateLastCheckedDatetime(apartmentId);
        return apartmentId;
      }

      this.logger.log(`Deleting apartment: ${apartmentId}`);
      await this.deleteApartment(apartmentId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async isApartmentInactive(id: string, url?: string): Promise<boolean> {
    try {
      const [providerName] = id.split('_');
      const provider = this.baseProvider.createProvider(providerName);
      return provider.updateCurrentPriceAndReturnIsApartmentInactive(
        id,
        this.apartmentRepository,
        url,
      );
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  isCheckableApartment(lastCheckedAt: Date): boolean {
    const FIVE_MINUTES = 300000;
    if (new Date().getTime() - lastCheckedAt.getTime() > FIVE_MINUTES) {
      return true;
    }

    return false;
  }

  async saveApartmentListFromProviders(filter: FilterDto) {
    try {
      const providerRequests = this.baseProvider.getProviderRequests(filter);

      return this.findAndSaveApartmentsFromProviders(providerRequests, filter);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async validateApartment(apartmentId: string): Promise<ApartmentStatus> {
    const apartmentInfo = await this.apartmentRepository.findOne(
      {
        id: apartmentId,
      },
      {
        select: ['url'],
      },
    );
    if (!apartmentInfo) {
      return {
        isValid: false,
      };
    }

    return {
      isValid: true,
      url: apartmentInfo.url,
    };
  }

  async validateApartmentListFromDatabase(
    filter: ApartmentListParamsDto,
  ): Promise<void> {
    try {
      const hasNextPage = false;
      let apartmentListLength = 0;
      const cursorFilter = Object.assign({}, filter);

      do {
        const {
          data: apartmentList,
          pageInfo,
        } = await this.apartmentRepository.getCursorPaginatedApartmentList(
          cursorFilter,
        );
        if (apartmentList.length === 0) break;
        const apartmentsIds = await Promise.all(
          apartmentList.map(apartment =>
            this.handleDeletingInactiveApartment(
              apartment.id,
              new Date(apartment.lastCheckedAt),
              apartment.url,
            ),
          ),
        );
        const activeApartmentsIds = apartmentsIds.filter(
          apartmentId => !!apartmentId,
        );
        cursorFilter.cursor = pageInfo.endCursor;
        apartmentListLength += activeApartmentsIds.length;
      } while (apartmentListLength < filter.limitPerPage);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
