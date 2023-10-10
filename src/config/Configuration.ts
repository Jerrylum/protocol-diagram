import { makeAutoObservable } from "mobx";
import { HandleResult, fail } from "../command/HandleResult";
import { Parameter, ParameterType } from "../token/Tokens";
import { EnumOption, Option, OptionType, RangeOption, BooleanOption } from "./Option";
import { Expose, Type } from "class-transformer";
import { ValidateNested, IsArray, ValidationOptions, registerDecorator, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";

@ValidatorConstraint({ async: true })
export class IsInArrayOptionConstraint implements ValidatorConstraintInterface {
  validate(options: unknown, args: ValidationArguments) {
      return Array.isArray(options) && options.every(option => this.isValidOption(option));
  }

  private isValidOption(option: Option<OptionType>): boolean {
    return (option instanceof Option);
  }
}

export function IsInArrayOption(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsInArrayOptionConstraint
    });
  };
}

/**
 * Manages a list of available options, provides API for other classes to get
 * the value of a option, the list of options, set the value of a option
 */
export class Configuration {
  @ValidateNested()
  @IsArray()
  @IsInArrayOption()
  @Expose()
  @Type(() => Option, {
    discriminator: {
      property: "__type",
      subTypes: [
        { value: EnumOption, name: "enum-option" },
        { value: RangeOption, name: "range-option" },
        { value: BooleanOption, name: "boolean-option" }
      ]
    },
    keepDiscriminatorProperty: true
  })
  readonly options: ReadonlyArray<Option<OptionType>>;

  constructor(...options: Option<OptionType>[]) {
    makeAutoObservable(this);
    this.options = options;
  }

  /**
   * Sets the value of specified option from this configuration by
   * the given key and value
   * Supports exact match and prefix match
   *
   * @param key   the key used to set the value of option
   * @param value the value of the option
   * @return HandleResult
   */
  setValue(key: string, value: Parameter<ParameterType>): HandleResult {
    const option = this.getOption(key);
    if (option === null) {
      return fail('Unknown or ambiguous option "' + key + '".');
    } else {
      return option.setValue(value);
    }
  }

  /**
   * Retrieves the value of option by the provided key
   * Supports exact match and prefix match
   *
   * @param key the key used to match option
   * @return the value of the option which is based on the given key
   */
  public getValue(key: string): OptionType | null {
    const option = this.getOption(key);
    if (option === null) {
      return null;
    } else {
      return option.getValue();
    }
  }

  /**
   * Looks up the matching option based on the given key
   * First checks for an exact match and assigns the matching option to the selected variable
   * If there is no exact match, then check for options with a key prefix that matches
   * the given key and assigns the first matching option to selected
   * If multiple options have the same prefix, then return null to indicate ambiguity
   *
   * @param key the key of the option
   * @return the option that matches the key
   */
  getOption(key: string): Option<OptionType> | null {
    let selected: Option<OptionType> | null = null;
    for (const option of this.options) {
      if (option.key === key.toLowerCase()) {
        selected = option;
        break;
      }
      if (option.key.startsWith(key.toLowerCase())) {
        if (selected !== null) {
          return null;
        }
        selected = option;
      }
    }
    return selected;
  }
}
