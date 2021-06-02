import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'customText', async: false })
export class ArrayContainsValidator implements ValidatorConstraintInterface {
  validate(elements: string[], args: ValidationArguments): boolean {
    return (
      Array.isArray(elements) &&
      elements.filter((element: string): boolean =>
        args.constraints.includes(element),
      ).length > 0
    );
  }

  defaultMessage(): string {
    return '($value) doesn\'t contain valid values!';
  }
}
