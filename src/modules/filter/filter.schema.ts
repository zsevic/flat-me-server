import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Token } from 'modules/token/token.schema';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FiltersDocument = Filters & Document;

@Schema()
export class Filters {
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
  userId: string;

  @Prop()
  token: Token;
}

export const FiltersSchema = SchemaFactory.createForClass(Filters);
