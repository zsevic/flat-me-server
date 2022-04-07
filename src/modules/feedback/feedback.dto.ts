import { IsNotEmpty, IsString } from 'class-validator';

export class FeedbackDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
