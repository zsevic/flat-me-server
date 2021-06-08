import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop()
  email: string;

  @Prop({
    default: false,
  })
  is_active: boolean;
}

export const FiltersSchema = SchemaFactory.createForClass(Filters);
