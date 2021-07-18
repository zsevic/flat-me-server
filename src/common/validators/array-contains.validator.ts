import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'customText', async: false })
export class ArrayContainsValidator implements ValidatorConstraintInterface {
  validate(elements: (string | number)[], args: ValidationArguments): boolean {
    return (
      Array.isArray(elements) &&
      elements.filter(
        (element: string | number): boolean =>
          args.constraints.indexOf(element) !== -1,
      ).length > 0
    );
  }

  defaultMessage(): string {
    return '($value) doesn\'t contain valid values!';
  }
}
