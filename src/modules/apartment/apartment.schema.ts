import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApartmentDocument = Apartment & Document;

@Schema({
  _id: false,
})
class LocationSchema {
  @Prop()
  latitude: number;

  @Prop()
  longitude: number;
}

@Schema({
  timestamps: true,
})
export class Apartment {
  @Prop()
  _id: string;

  @Prop()
  address: string;

  @Prop()
  availableFrom: string;

  @Prop()
  coverPhotoUrl: string;

  @Prop()
  floor: string;

  @Prop()
  heatingTypes: string[];

  @Prop()
  furnished: string;

  @Prop()
  location: LocationSchema;

  @Prop()
  municipality: string;

  @Prop()
  place: string;

  @Prop()
  postedAt: string;

  @Prop()
  price: number;

  @Prop()
  rentOrSale: string;

  @Prop()
  size: number;

  @Prop()
  structure: number;

  @Prop()
  url: string;
}

export const ApartmentSchema = SchemaFactory.createForClass(Apartment);
