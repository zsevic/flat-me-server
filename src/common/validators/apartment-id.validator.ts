import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'customText', async: false })
export class ApartmentIdValidator implements ValidatorConstraintInterface {
  validate(id: string, args: ValidationArguments): boolean {
    const [providerName] = id.split('_');
    return args.constraints.indexOf(providerName) !== -1;
  }

  defaultMessage({ value }): string {
    return `'${value}' is not valid apartment id`;
  }
}
