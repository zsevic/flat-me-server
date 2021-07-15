import { IsEmail } from 'class-validator';

export class SseQueryDto {
  @IsEmail()
  email: string;
}
