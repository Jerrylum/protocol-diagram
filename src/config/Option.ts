import "reflect-metadata";
import { makeObservable, observable } from "mobx";
import { HandleResult, success, fail } from "../command/HandleResult";
import { Parameter, ParameterType } from "../token/Tokens";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator
} from "class-validator";
import { Expose } from "class-transformer";

export type OptionType = boolean | number | string;

@ValidatorConstraint({ async: true })
export class IsInArrayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const obj = args.object;
    if (obj instanceof EnumOption) {
      return Array.isArray(obj.acceptedValues) && (obj.acceptedValues as readonly string[]).includes(value as string);
    } else return false;
  }
}

export function IsInAcceptedValues(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsInArrayConstraint
    });
  };
}

@ValidatorConstraint({ async: true })
export class IsMaxConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const obj = args.object;
    if (obj instanceof RangeOption) {
      const value = obj.max;
      return value >= obj.min;
    } else return false;
  }
}

export function IsMax(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMaxConstraint
    });
  };
}

@ValidatorConstraint({ async: true })
export class IsMinConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const obj = args.object;
    if (obj instanceof RangeOption) {
      const value = obj.min;
      return value <= obj.max;
    } else return false;
  }
}

export function IsMin(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMinConstraint
    });
  };
}

@ValidatorConstraint({ async: true })
export class IsWithinRangeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const obj = args.object;
    if (obj instanceof RangeOption && typeof value === "number") {
      const min = obj.min;
      const max = obj.max;
      return value <= obj.max && value >= obj.min;
    } else return false;
  }
}

export function IsWithinRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsWithinRangeConstraint
    });
  };
}

/**
 * this abstract class provides a basic shape of an option class, that takes a
 * key in order to instantiate an option class, once it is set, it could not be
 * changed afterward
 */
export abstract class Option<T extends OptionType> {
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly key: string;
  readonly defaultValue: T;
  protected value: T;

  constructor(key: string, defaultValue: T, value: T = defaultValue) {
    this.key = key;
    this.defaultValue = defaultValue;
    this.value = value;
  }

  /**
   * a setter method that sets the value of this option
   *
   * @param value the value of this option
   * @return HandleResult
   */
  public abstract setValue(value: Parameter<ParameterType> | T): HandleResult;

  /**
   * a getter method that retrieves the value of this option
   *
   * @return the value of this option
   */
  public getValue(): T {
    return this.value;
  }

  /**
   * a method that returns a manual statement for displaying the usage description
   *
   * @return the usage description of this option
   */
  public abstract getUsageDescription(): string;

  /**
   * a method that returns a clone of this option
   */
  public abstract clone(): Option<T>;
}

export class BooleanOption extends Option<boolean> {
  @IsBoolean()
  @Expose()
  readonly defaultValue: boolean;
  @IsBoolean()
  @Expose()
  protected value: boolean;

  public constructor(key: string, defaultValue: boolean, value: boolean = defaultValue) {
    super(key, defaultValue, value);
    this.defaultValue = defaultValue;
    this.value = value;
    makeObservable<BooleanOption, "value">(this, { value: observable });
  }

  setValue(value: Parameter<ParameterType> | boolean): HandleResult {
    if (value instanceof Parameter) {
      if (value.isBoolean()) {
        return this.setValue(value.getBoolean());
      } else {
        return fail("The value must be a boolean.");
      }
    } else {
      const oldValue = this.value;
      if (oldValue === value) {
        return fail("It is already " + value + ".");
      } else {
        this.value = value;
        return success('Set "' + this.key + '" from ' + oldValue + " to " + value + ".");
      }
    }
  }

  getUsageDescription(): string {
    return this.defaultValue ? "TRUE | false" : "true | FALSE";
  }

  clone(): BooleanOption {
    return new BooleanOption(this.key, this.defaultValue, this.value);
  }
}

/**
 * this class is an option class that extends the logic of confining the
 * possible values of string literals
 */
export class EnumOption<TAccepts extends readonly string[]> extends Option<TAccepts[number]> {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Expose()
  readonly acceptedValues: TAccepts;
  @IsString()
  @IsInAcceptedValues()
  @Expose()
  readonly defaultValue: TAccepts[number];
  @IsString()
  @IsInAcceptedValues()
  @Expose()
  protected value: TAccepts[number];

  constructor(
    key: string,
    defaultValue: TAccepts[number],
    acceptedValues: TAccepts,
    value: TAccepts[number] = defaultValue
  ) {
    super(key, defaultValue, value);
    this.defaultValue = defaultValue;
    this.acceptedValues = acceptedValues;
    this.value = value;
    makeObservable<EnumOption<TAccepts>, "value">(this, { value: observable });
  }

  setValue(value: Parameter<ParameterType> | string): HandleResult {
    if (value instanceof Parameter) {
      if (value.isString()) {
        return this.setValue(value.getString());
      } else {
        return fail('The value "' + value + '" is not accepted.');
      }
    } else {
      let selected: string | null = null;
      for (const acceptedValue of this.acceptedValues) {
        if (acceptedValue === value.toLowerCase()) {
          selected = acceptedValue;
          break;
        }
        if (acceptedValue.startsWith(value.toLowerCase())) {
          if (selected != null) {
            return fail('Ambiguous value "' + value + '".');
          }
          selected = acceptedValue;
        }
      }

      if (selected === null) {
        return fail('Unknown value "' + value + '".');
      } else {
        let oldValue: string = this.value;
        if (oldValue === selected) {
          return fail('It is already "' + selected + '".');
        } else {
          this.value = selected;
          return success('Set "' + this.key + '" from "' + oldValue + '" to "' + selected + '".');
        }
      }
    }
  }

  getUsageDescription(): string {
    return this.acceptedValues.map(v => (v === this.defaultValue ? v.toUpperCase() : v)).join(" | ");
  }

  clone() {
    return new EnumOption(this.key, this.defaultValue, this.acceptedValues, this.value);
  }
}

export class RangeOption extends Option<number> {
  @IsNumber()
  @IsInt()
  @IsWithinRange()
  @Expose()
  readonly defaultValue: number;
  @IsNumber()
  @IsInt()
  @IsMin()
  @Expose()
  readonly min: number;
  @IsNumber()
  @IsInt()
  @IsMax()
  @Expose()
  readonly max: number;
  @IsNumber()
  @IsInt()
  @IsWithinRange()
  @Expose()
  protected value: number;

  constructor(key: string, defaultValue: number, min: number, max: number, value: number = defaultValue) {
    super(key, defaultValue, value);
    this.defaultValue = defaultValue;
    this.min = min;
    this.max = max;
    this.value = value;
    makeObservable<RangeOption, "value">(this, { value: observable });
  }

  setValue(value: Parameter<ParameterType> | number): HandleResult {
    if (value instanceof Parameter) {
      if (value.isNumber() && !value.isDouble()) {
        return this.setValue(value.getInt());
      } else {
        return fail("The value must be an integer.");
      }
    } else {
      let oldValue: number = this.value;
      if (!Number.isInteger(value)) {
        return fail("The value must be an integer.");
      }
      if (oldValue === value) {
        return fail("It is already " + value + ".");
      } else if (value < this.min || value > this.max) {
        return fail("The value must be between " + this.min + " and " + this.max + ".");
      } else {
        this.value = value;
        return success('Set "' + this.key + '" from ' + oldValue + " to " + value + ".");
      }
    }
  }

  getUsageDescription(): string {
    return "min:" + this.min + " max:" + this.max + " default:" + this.defaultValue;
  }

  clone() {
    return new RangeOption(this.key, this.defaultValue, this.min, this.max, this.value);
  }
}
