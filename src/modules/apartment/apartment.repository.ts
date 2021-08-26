import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { getSkip } from 'common/utils';
import { Apartment, ApartmentDocument } from './apartment.schema';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';

@Injectable()
export class ApartmentRepository {
  constructor(
    @InjectModel(Apartment.name)
    private apartmentModel: Model<ApartmentDocument>,
  ) {}

  async deleteApartment(id: string): Promise<void> {
    await this.apartmentModel.findByIdAndDelete(id);
  }

  async getApartmentList(
    filter: ApartmentListParamsDto,
    skippedApartments?: string[],
    dateFilter?: Date,
  ) {
    const { limitPerPage = 10, pageNumber = 1 } = filter;
    const query = {
      ...(skippedApartments &&
        Array.isArray(skippedApartments) &&
        skippedApartments.length > 0 && {
          _id: {
            $nin: skippedApartments,
          },
        }),
      ...(dateFilter && {
        createdAt: {
          $gte: dateFilter,
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
      .skip(getSkip({ pageNumber, limitPerPage }))
      .limit(limitPerPage)
      .exec();
    // @ts-ignore
    const total = await this.apartmentModel.countDocuments(query).exec();

    return {
      data,
      total,
    };
  }

  async getApartmentsIds(): Promise<string[]> {
    const apartmentList = await this.apartmentModel.find().select('_id');

    return apartmentList.map(apartment => apartment._id);
  }

  async saveApartmentList(apartments: Apartment[]): Promise<Apartment[]> {
    return this.apartmentModel.create(apartments);
  }
}
