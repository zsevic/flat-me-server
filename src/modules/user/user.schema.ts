import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Subscription } from './subscription.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
  })
  _id: string;

  @Prop()
  email: string;

  @Prop({
    default: false,
  })
  isVerified: boolean;

  @Prop({
    ref: 'Filter',
    type: [MongooseSchema.Types.ObjectId],
  })
  filters: string[];

  @Prop({
    ref: 'Apartment',
    type: [String],
  })
  receivedApartments: string[];

  @Prop({
    enum: Subscription,
    default: Subscription.FREE,
  })
  subscription: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
