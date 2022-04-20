import { IsNotEmpty } from 'class-validator';

export class FoundApartmentListParamsDto {
  @IsNotEmpty()
  token: string;
}
