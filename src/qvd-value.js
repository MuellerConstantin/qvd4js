/**
 * Represents a Qlik value, stored in a QVD file.
 */
export class QvdValue {
  /**
   * Constructs a new QVD value.
   *
   * @param {Number} intValue The integer value.
   * @param {Number} doubleValue The double value.
   * @param {String} stringValue The string value.
   */
  constructor(intValue, doubleValue, stringValue) {
    this._intValue = intValue;

    this._doubleValue = doubleValue;

    this._stringValue = stringValue;
  }

  /**
   * Returns the integer value of this symbol.
   *
   * @return {Number} The integer value.
   */
  get intValue() {
    return this._intValue;
  }

  /**
   * Returns the double value of this symbol.
   *
   * @return {Number} The double value.
   */
  get doubleValue() {
    return this._doubleValue;
  }

  /**
   * Returns the string value of this symbol.
   *
   * @return {String} The string value.
   */
  get stringValue() {
    return this._stringValue;
  }

  /**
   * Retrieves the primary value of this symbol. The primary value is descriptive raw value.
   * It is either the string value, the integer value or the double value, prioritized in this order.
   *
   * @return {Number|String} The primary value.
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
   * @param {Number} intValue The integer value.
   * @return {QvdValue} The constructed value symbol.
   */
  static fromIntValue(intValue) {
    return new QvdValue(intValue, null, null);
  }

  /**
   * Constructs a pure double value symbol.
   *
   * @param {Number} doubleValue The double value.
   * @return {QvdValue} The constructed value symbol.
   */
  static fromDoublValue(doubleValue) {
    return new QvdValue(null, doubleValue, null);
  }

  /**
   * Constructs a pure string value symbol.
   *
   * @param {String} stringValue The string value.
   * @return {QvdValue} The constructed value symbol.
   */
  static fromStringValue(stringValue) {
    return new QvdValue(null, null, stringValue);
  }

  /**
   * Constructs a dual value symbol from an integer and a string value.
   *
   * @param {Number} intValue The integer value.
   * @param {String} stringValue The string value.
   * @return {QvdValue} The constructed value symbol.
   */
  static fromDualIntValue(intValue, stringValue) {
    return new QvdValue(intValue, null, stringValue);
  }

  /**
   * Constructs a dual value symbol from a double and a string value.
   *
   * @param {Number} doubleValue The double value.
   * @param {String} stringValue The string value.
   * @return {QvdValue} The constructed value symbol.
   */
  static fromDualDoubleValue(doubleValue, stringValue) {
    return new QvdValue(null, doubleValue, stringValue);
  }
}
