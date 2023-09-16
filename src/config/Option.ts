import { HandleResult, success, fail } from "../command/HandleResult";
import { Parameter } from "../token/Tokens";

/**
 * this abstract class provides a basic shape of an option class, that takes a
 * key in order to instantiate an option class, once it is set, it could not be
 * changed afterward
 */
export abstract class Option<T> {
  /**
   * the key of this option, it should be treated as a readonly value,
   * since by logic, the key of a option should not be able to be changed,
   * otherwise it would cause confusions
   */

  constructor(readonly key: string) {}

  /**
   * a setter method that sets the value of this option
   *
   * @param value the value of this option
   * @return HandleResult
   */
  public abstract setValue(value: Parameter | T): HandleResult;

  /**
   * a getter method that retrieves the value of this option
   *
   * @return the value of this option
   */
  public abstract getValue(): T;

  /**
   * a getter method that retrieves the default value of this option
   *
   * @return the default value of this option
   */
  public abstract getDefault(): T;

  /**
   * a method that returns a manual statement for displaying the usage description
   *
   * @return the usage description of this option
   */
  public abstract getUsageDescription(): string;
}

export class BooleanOption extends Option<boolean> {
  private value: boolean;

  public constructor(key: string, readonly defaultValue: boolean) {
    super(key);
    this.value = defaultValue;
  }

  /**
   * a wrapper method that sets the value of this boolean option, the value of the
   * parameter is required to be an boolean
   *
   * @return whether the value is set successfully
   */
  setValue(value: Parameter | boolean): HandleResult {
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

  /**
   * a getter method that reads the value of this boolean option and returns it
   *
   * @return the value of this boolean option
   */
  getValue(): boolean {
    return this.value;
  }

  /**
   * a getter method that returns the default value of this boolean option
   *
   * @return the default value of this boolean option
   */
  getDefault(): boolean {
    return this.defaultValue;
  }

  /**
   * a method that returns a manual statement
   *
   * @return the usage description of this option
   */
  public getUsageDescription(): string {
    return this.defaultValue ? "TRUE | false" : "true | FALSE";
  }
}

/**
 * this class is an option class that extends the logic of confining the
 * possible values of string literals
 */
export class EnumOption extends Option<string> {
  private value: string;

  constructor(key: string, readonly defaultValue: string, private acceptedValues: string[]) {
    super(key);
    this.value = defaultValue;
  }

  /**
   * a wrapper method that sets the value of the parameters, the value of the
   * parameter is required to be string
   *
   * @param value the value of this option
   * @return whether the value is set successfully
   */
  public setValue(value: Parameter | string): HandleResult {
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

  /**
   * a getter method that retrieves the value of this enum option
   *
   * @return the value of this enum option
   */
  getValue(): string {
    return this.value;
  }

  /**
   * a getter method that retrieves the default value of this enum option
   *
   * @return the default value of this enum option
   */
  getDefault(): string {
    return this.defaultValue;
  }

  /**
   * a method that retrieves a manual statement for this enum option
   *
   * @return the manual statement for this enum option
   */
  getUsageDescription(): string {
    return this.acceptedValues.map(v => (v === this.defaultValue ? v.toUpperCase() : v)).join(" | ");
  }
}

export class RangeOption extends Option<number> {
  private value: number;

  public constructor(key: string, readonly defaultValue: number, readonly min: number, readonly max: number) {
    super(key);
    this.value = defaultValue;
  }

  /**
   * a wrapper method that sets the value of this range option, the value of the
   * parameter is required to be an integer
   *
   * @return whether the value is set successfully
   */
  setValue(value: Parameter | number): HandleResult {
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

  /**
   * a getter method that retrieve the value of this range option
   *
   * @return the value of this range option
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * a getter method that return the default value of this range option
   *
   * @return the default value of this range option
   */
  public getDefault(): number {
    return this.defaultValue;
  }

  /**
   * a method that return a manual statement.
   *
   * @return the manual statement
   */
  getUsageDescription(): string {
    return "min:" + this.min + " max:" + this.max + " default:" + this.defaultValue;
  }
}
