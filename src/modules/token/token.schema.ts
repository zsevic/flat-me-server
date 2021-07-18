import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TokenDocument = Token & Document;

@Schema()
export class Token {
  @Prop()
  expiresAt: Date;

  @Prop()
  value: string;

  @Prop({
    ref: 'Filter',
    type: MongooseSchema.Types.ObjectId,
  })
  filter?: string;

  @Prop({
    ref: 'User',
    type: MongooseSchema.Types.ObjectId,
  })
  user?: string;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
