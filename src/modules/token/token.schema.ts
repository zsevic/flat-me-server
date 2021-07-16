import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Token {
  @Prop()
  expiresAt: Date;

  @Prop()
  value: string;
}
