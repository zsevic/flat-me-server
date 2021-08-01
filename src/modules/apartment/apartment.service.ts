import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Apartment, ApartmentDocument } from './apartment.schema';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';
import {
  BaseProvider,
  CetiriZidaProvider,
  CityExpertProvider,
} from './providers';

@Injectable()
export class ApartmentService {
  private readonly providers = {
    cetiriZida: CetiriZidaProvider,
    cityExpert: CityExpertProvider,
  };
  private readonly logger = new Logger(ApartmentService.name);

  constructor(
    @InjectModel(Apartment.name)
    private apartmentModel: Model<ApartmentDocument>,
  ) {}

  async findApartments(providerRequests, filter: FilterDto) {
    const newRequests = [];

    const providerResults = await Promise.all(
      providerRequests.map(providerRequest => providerRequest.request),
    );
    for (const [index, providerResult] of providerResults.entries()) {
      const foundApartments = [];
      const { providerName } = providerRequests[index];

      const apartments = this.providers[providerName].getResults(
        providerResult,
      );
      apartments.forEach(apartment => {
        if (!apartment.price) return;

        const apartmentInfo = new this.providers[
          providerName
        ]().parseApartmentInfo(apartment, filter);
        foundApartments.push(apartmentInfo);
      });

      this.logger.log(
        `Found ${foundApartments.length} new apartment(s) from ${providerName} for ${filter.rentOrSale}, page ${filter.pageNumber}`,
      );
      try {
        await this.saveApartmentList(foundApartments);
      } catch (error) {
        this.logger.error(
          `Couldn't save apartments, error: ${JSON.stringify(error)}`,
        );
        continue;
      }

      const hasNextPage = this.providers[providerName].hasNextPage(
        providerResult,
        filter.pageNumber,
      );
      if (hasNextPage) {
        newRequests.push(
          new BaseProvider().getProviderRequest(
            providerName,
            this.providers[providerName],
            {
              ...filter,
              pageNumber: filter.pageNumber + 1,
            },
          ),
        );
      }
    }

    if (newRequests.length > 0) {
      const filterWithNextPage = {
        ...filter,
        pageNumber: filter.pageNumber + 1,
      };
      return this.findApartments(newRequests, filterWithNextPage);
    }
  }

  async getApartmentListFromProviders(filter: FilterDto) {
    try {
      const providerRequests = new BaseProvider().getProviderRequests(
        this.providers,
        filter,
      );

      return this.findApartments(providerRequests, filter);
    } catch (error) {
      console.error(error);
    }
  }

  async getApartmentListFromDatabase(
    filter: ApartmentListParamsDto,
    skippedApartmentments?: string[],
  ) {
    const { limitPerPage = 10, pageNumber = 1 } = filter;
    const query = {
      ...(skippedApartmentments &&
        Array.isArray(skippedApartmentments) &&
        skippedApartmentments.length > 0 && {
          _id: {
            $nin: skippedApartmentments,
          },
        }),
      furnished: {
        $in: filter.furnished,
      },
      municipality: {
        $in: filter.municipalities,
      },
      price: {
        $gte: filter.minPrice,
        $lte: filter.maxPrice,
      },
      rentOrSale: filter.rentOrSale,
      structure: {
        $in: filter.structures,
      },
    };

    const data = await this.apartmentModel
      // @ts-ignore
      .find(query)
      .skip((pageNumber - 1) * limitPerPage)
      .limit(limitPerPage)
      .exec();
    // @ts-ignore
    const total = await this.apartmentModel.countDocuments(query).exec();

    return {
      total,
      data,
    };
  }

  saveApartmentList = async (apartments): Promise<Apartment[]> =>
    this.apartmentModel.insertMany(apartments, {
      ordered: false,
    });
}
