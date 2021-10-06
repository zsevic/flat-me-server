import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'customText', async: false })
export class ArrayContainsValidator implements ValidatorConstraintInterface {
  validate(elements: (string | number)[], args: ValidationArguments): boolean {
    if (!Array.isArray(elements)) {
      return args.constraints.indexOf(elements) !== -1;
    }

    return (
      elements.filter(
        (element: string | number): boolean =>
          args.constraints.indexOf(element) !== -1,
      ).length === elements.length
    );
  }

  defaultMessage({ property, value }): string {
    return `(${property}) doesn\'t contain valid values (${value})!`;
  }
}
