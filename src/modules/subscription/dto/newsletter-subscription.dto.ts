import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, NotContains } from 'class-validator';

export class NewsletterSubscriptionDto {
  @NotContains('+')
  @IsNotEmpty()
  @IsEmail()
  @Transform((value: string): string => value.toLowerCase())
  email: string;
}
