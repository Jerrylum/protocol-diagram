import { HandleResult, fail } from "../command/HandleResult";
import { Parameter, ParameterType } from "../token/Tokens";
import { Option, OptionType } from "./Option";

/**
 * this class responsible in managing a list of available options, provides API
 * for other classes to get the value of a option, the list of options, set the
 * value
 * of a option.
 */
export class Configuration {
  readonly options: ReadonlyArray<Option<OptionType>>;

  constructor(...options: Option<OptionType>[]) {
    this.options = options;
  }

  /**
   * a method that sets the value of specified option from this configuration by
   * the given key and value
   *
   * @param key   the key of the option
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
   * a getter method that retrieves the value of option by the specified key
   *
   * @param key the key of the option
   * @return the value of the option
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
   * a find method that lookups the matching option based on the given key
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
