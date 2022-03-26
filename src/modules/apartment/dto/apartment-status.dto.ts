import { IsString, Validate } from 'class-validator';
import { ApartmentIdValidator } from 'common/validators/apartment-id.validator';
import { PROVIDERS } from '../apartment.constants';

export class ApartmentStatusDto {
  @Validate(ApartmentIdValidator, PROVIDERS)
  @IsString()
  id: string;
}
