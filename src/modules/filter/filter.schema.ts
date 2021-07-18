import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FilterDocument = Filter & Document;

@Schema()
export class Filter {
  @Prop()
  _id?: string;

  @Prop()
  minPrice: number;

  @Prop()
  maxPrice: number;

  @Prop()
  rentOrSale: string;

  @Prop()
  structures: number[];

  @Prop()
  municipalities: string[];

  @Prop({
    default: false,
  })
  isVerified: boolean;

  @Prop({
    ref: 'User',
    type: MongooseSchema.Types.ObjectId,
  })
  user: string;
}

export const FilterSchema = SchemaFactory.createForClass(Filter);
