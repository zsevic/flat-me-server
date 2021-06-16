import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FiltersDto } from 'modules/filter/dto/filters.dto';
import { Apartment, ApartmentDocument } from '../apartment.schema';
import {
  BaseProvider,
  CetiriZidaProvider,
  CityExpertProvider,
} from '../providers';

@Injectable()
export class ApartmentService {
  private readonly providers = {
    cetiriZida: CetiriZidaProvider,
    cityExpert: CityExpertProvider,
  };

  constructor(
    @InjectModel(Apartment.name)
    private apartmentModel: Model<ApartmentDocument>,
  ) {}

  async findApartments(providerRequests, filters: FiltersDto, foundApartments) {
    const newRequests = [];
    const filtersWithNextPage = {
      ...filters,
      pageNumber: filters.pageNumber + 1,
    };

    const providerResults = await Promise.all(
      providerRequests.map(providerRequest => providerRequest.request),
    );
    providerResults.forEach((providerResult: any, index) => {
      const { providerName } = providerRequests[index];

      const apartments = this.providers[providerName].getResults(
        providerResult,
      );
      apartments.forEach(apartment => {
        if (!apartment.price) return;

        const apartmentInfo = new this.providers[
          providerName
        ]().parseApartmentInfo(apartment, filters);
        foundApartments.push(apartmentInfo);
      });
      const hasNextPage = this.providers[providerName].hasNextPage(
        providerResult,
        filters.pageNumber,
      );
      if (hasNextPage) {
        newRequests.push(
          new BaseProvider().getProviderRequest(
            providerName,
            this.providers[providerName],
            {
              ...filters,
              pageNumber: filters.pageNumber + 1,
            },
          ),
        );
      }
    });

    return newRequests.length > 0
      ? this.findApartments(newRequests, filtersWithNextPage, foundApartments)
      : foundApartments;
  }

  async getApartmentListFromProviders(filters: FiltersDto) {
    try {
      const providerRequests = new BaseProvider().getProviderRequests(
        this.providers,
        filters,
      );

      return this.findApartments(providerRequests, filters, []);
    } catch (error) {
      console.error(error);
    }
  }

  async getApartmentListFromDatabase(filters: FiltersDto) {
    // @ts-ignore
    return this.apartmentModel.find({
      price: {
        $gte: filters.minPrice,
        $lte: filters.maxPrice,
      },
      municipality: {
        $in: filters.municipalities,
      },
      rentOrSale: filters.rentOrSale,
      structure: {
        $in: filters.structures,
      },
    });
  }

  saveApartmentList = async (apartments): Promise<Apartment[]> =>
    this.apartmentModel.insertMany(apartments, {
      ordered: false,
    });
}
