import { IsEmail, IsNotEmpty } from 'class-validator';

export class Subscription {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
