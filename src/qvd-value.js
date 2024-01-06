// @ts-check

/**
 * Represents a Qlik value, stored in a QVD file.
 */
export class QvdValue {
  /**
   * Constructs a new QVD value.
   *
   * @param {number|null} intValue The integer value.
   * @param {number|null} doubleValue The double value.
   * @param {string|null} stringValue The string value.
   */
  constructor(intValue, doubleValue, stringValue) {
    this._intValue = intValue;

    this._doubleValue = doubleValue;

    this._stringValue = stringValue;
  }

  /**
   * Returns the integer value of this symbol.
   *
   * @return {number|null} The integer value.
   */
  get intValue() {
    return this._intValue;
  }

  /**
   * Returns the double value of this symbol.
   *
   * @return {number|null} The double value.
   */
  get doubleValue() {
    return this._doubleValue;
  }

  /**
   * Returns the string value of this symbol.
   *
   * @return {string|null} The string value.
   */
  get stringValue() {
    return this._stringValue;
  }

  /**
   * Retrieves the primary value of this symbol. The primary value is descriptive raw value.
   * It is either the string value, the integer value or the double value, prioritized in this order.
   *
   * @return {number|string|null} The primary value.
   */
  toPrimaryValue() {
    if (null != this._stringValue) {
      return this._stringValue;
    } else if (null != this._intValue) {
      return this._intValue;
    } else if (null != this._doubleValue) {
      return this._doubleValue;
    } else {
      return null;
    }
  }

  /**
   * Constructs a pure integer value symbol.
   *
   * @param {number} intValue The integer value.
   * @return {QvdValue} The constructed value symbol.
   */
  static fromIntValue(intValue) {
    return new QvdValue(intValue, null, null);
  }

  /**
   * Constructs a pure double value symbol.
   *
   * @param {number} doubleValue The double value.
   * @return {QvdValue} The constructed value symbol.
   */
  static fromDoublValue(doubleValue) {
    return new QvdValue(null, doubleValue, null);
  }

  /**
   * Constructs a pure string value symbol.
   *
   * @param {string} stringValue The string value.
   * @return {QvdValue} The constructed value symbol.
   */
  static fromStringValue(stringValue) {
    return new QvdValue(null, null, stringValue);
  }

  /**
   * Constructs a dual value symbol from an integer and a string value.
   *
   * @param {number} intValue The integer value.
   * @param {string} stringValue The string value.
   * @return {QvdValue} The constructed value symbol.
   */
  static fromDualIntValue(intValue, stringValue) {
    return new QvdValue(intValue, null, stringValue);
  }

  /**
   * Constructs a dual value symbol from a double and a string value.
   *
   * @param {number} doubleValue The double value.
   * @param {string} stringValue The string value.
   * @return {QvdValue} The constructed value symbol.
   */
  static fromDualDoubleValue(doubleValue, stringValue) {
    return new QvdValue(null, doubleValue, stringValue);
  }
}
