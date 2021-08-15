import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FilterDocument = Filter & Document;

@Schema({
  timestamps: true,
})
export class Filter {
  @Prop()
  _id?: string;

  @Prop()
  furnished: string[];

  @Prop()
  minPrice: number;

  @Prop()
  maxPrice: number;

  @Prop()
  municipalities: string[];

  @Prop()
  rentOrSale: string;

  @Prop()
  structures: number[];

  @Prop({
    default: false,
  })
  isActive: boolean;

  @Prop({
    default: false,
  })
  isVerified: boolean;

  @Prop({
    ref: 'User',
    type: MongooseSchema.Types.ObjectId,
  })
  user: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const FilterSchema = SchemaFactory.createForClass(Filter);
