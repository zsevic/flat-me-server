import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Subscription } from './subscription.enum';

export type UserDocument = User & Document;

@Schema()
class Token {
  @Prop()
  expires_at: Date;

  @Prop()
  value: string;
}

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
  is_verified: boolean;

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
