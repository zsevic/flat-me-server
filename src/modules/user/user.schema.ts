import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Token } from 'modules/token/token.schema';
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
    ref: 'Apartment',
    type: [MongooseSchema.Types.ObjectId],
  })
  receivedApartments: string[];

  @Prop({
    enum: Subscription,
    default: Subscription.FREE,
  })
  subscription: string;

  @Prop()
  token: Token;
}

export const UserSchema = SchemaFactory.createForClass(User);
