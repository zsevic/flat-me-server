import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
    ref: 'User',
    type: MongooseSchema.Types.ObjectId,
  })
  user_id: string;
}

export const FiltersSchema = SchemaFactory.createForClass(Filters);
