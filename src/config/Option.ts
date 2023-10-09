import { makeObservable, observable } from "mobx";
import { HandleResult, success, fail } from "../command/HandleResult";
import { Parameter, ParameterType } from "../token/Tokens";

export type OptionType = boolean | number | string;

/**
 * this abstract class provides a basic shape of an option class, that takes a
 * key in order to instantiate an option class, once it is set, it could not be
 * changed afterward
 */
export abstract class Option<T extends OptionType> {
  constructor(readonly key: string, readonly defaultValue: T, protected value: T = defaultValue) {}

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
  public constructor(key: string, defaultValue: boolean, value: boolean = defaultValue) {
    super(key, defaultValue, value);
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
  constructor(
    key: string,
    defaultValue: TAccepts[number],
    readonly acceptedValues: TAccepts,
    value: TAccepts[number] = defaultValue
  ) {
    super(key, defaultValue, value);
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
          if (selected !== null) {
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
  constructor(
    key: string,
    defaultValue: number,
    readonly min: number,
    readonly max: number,
    value: number = defaultValue
  ) {
    super(key, defaultValue, value);
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
