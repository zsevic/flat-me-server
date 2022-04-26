import { IsNotEmpty } from 'class-validator';

export class NotificationUnsubscriptionDto {
  @IsNotEmpty()
  token: string;
}
