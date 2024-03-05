// @ts-check

import fs from 'fs';
import xml from 'xml2js';
import assert from 'assert';

/**
 * @typedef {{[name: string]: any}} QvdHeader
 *
 * The header contains the meta data of the QVD file. It is a plain JavaScript object
 * that is parsed from the XML header of the QVD file. It is important to note that the
 * object is a plain JavaScript object and not an instance of representative class. For
 * more information see the documentation of the parser implementation in
 * {@link QvdFileParser._parseHeader|QvdFileParser}.
 */

/**
 * @typedef {Array<Array<any>>} QvdSymbolTable
 *
 * The symbol table contains the values of the QVD file. It is a two-dimensional array
 * of QVD values. The first dimension represents the fields/columns of the QVD file, the
 * second dimension represents the possible values of the respective field/column.
 */

/**
 * @typedef {Array<Array<number>>} QvdIndexTable
 *
 * The index table contains the indices referencing the symbol table for reach row. It is
 * a two-dimensional array of numbers. The first dimension represents the rows of the QVD
 * file, the second dimension represents the fields/columns containing the indices of the
 * respective column value in the symbol table.
 */

/**
 * Represents a Qlik symbol/value, stored in a QVD file.
 */
export class QvdSymbol {
  /**
   * Constructs a new QVD symbol.
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
   * Checks if this symbol is equal to another symbol.
   *
   * @param {*} value The object to compare with.
   * @return {boolean} True if the objects are equal, false otherwise.
   */
  equals(value) {
    if (!(value instanceof QvdSymbol)) {
      return false;
    }

    return (
      this._intValue === value.intValue &&
      this._doubleValue === value.doubleValue &&
      this._stringValue === value.stringValue
    );
  }

  /**
   * Constructs a pure integer value symbol.
   *
   * @param {number} intValue The integer value.
   * @return {QvdSymbol} The constructed value symbol.
   */
  static fromIntValue(intValue) {
    return new QvdSymbol(intValue, null, null);
  }

  /**
   * Constructs a pure double value symbol.
   *
   * @param {number} doubleValue The double value.
   * @return {QvdSymbol} The constructed value symbol.
   */
  static fromDoublValue(doubleValue) {
    return new QvdSymbol(null, doubleValue, null);
  }

  /**
   * Constructs a pure string value symbol.
   *
   * @param {string} stringValue The string value.
   * @return {QvdSymbol} The constructed value symbol.
   */
  static fromStringValue(stringValue) {
    return new QvdSymbol(null, null, stringValue);
  }

  /**
   * Constructs a dual value symbol from an integer and a string value.
   *
   * @param {number} intValue The integer value.
   * @param {string} stringValue The string value.
   * @return {QvdSymbol} The constructed value symbol.
   */
  static fromDualIntValue(intValue, stringValue) {
    return new QvdSymbol(intValue, null, stringValue);
  }

  /**
   * Constructs a dual value symbol from a double and a string value.
   *
   * @param {number} doubleValue The double value.
   * @param {string} stringValue The string value.
   * @return {QvdSymbol} The constructed value symbol.
   */
  static fromDualDoubleValue(doubleValue, stringValue) {
    return new QvdSymbol(null, doubleValue, stringValue);
  }
}

/**
 * Represents a loaded QVD file.
 */
export class QvdDataFrame {
  /**
   * Represents the data frame stored inside a QVD file.
   * @param {Array<Array<any>>} data The data of the data frame.
   * @param {Array<string>} columns The columns of the data frame.
   */
  constructor(data, columns) {
    this._data = data;
    this._columns = columns;
  }

  /**
   * Returns the data of the data frame.
   */
  get data() {
    return this._data;
  }

  /**
   * Returns the columns of the data frame.
   */
  get columns() {
    return this._columns;
  }

  /**
   * Returns the shape of the data frame.
   */
  get shape() {
    return [this._data.length, this._columns.length];
  }

  /**
   * Returns the first n rows of the data frame.
   *
   * @param {number} n The number of rows to return.
   * @return {QvdDataFrame} The first n rows of the data frame.
   */
  head(n = 5) {
    return new QvdDataFrame(this._data.slice(0, n), this._columns);
  }

  /**
   * Returns the last n rows of the data frame.
   *
   * @param {number} n The number of rows to return.
   * @return {QvdDataFrame} The first n rows of the data frame.
   */
  tail(n = 5) {
    return new QvdDataFrame(this._data.slice(-n), this._columns);
  }

  /**
   * Returns the selected rows of the data frame.
   *
   * @param  {...number} args The indices of the rows to return.
   * @return {QvdDataFrame} The selected rows of the data frame.
   */
  rows(...args) {
    return new QvdDataFrame(
      args.map((index) => this._data[index]),
      this._columns,
    );
  }

  /**
   * Returns the value at the specified row and column.
   *
   * @param {number} row The index of the row.
   * @param {string} column The name of the column.
   * @return {any} The value at the specified row and column.
   */
  at(row, column) {
    return this._data[row][this._columns.indexOf(column)];
  }

  /**
   * Selects the specified columns from the data frame.
   *
   * @param  {...string} args The names of the columns to select.
   * @return {QvdDataFrame} The selected columns of the data frame.
   */
  select(...args) {
    const indices = args.map((arg) => this._columns.indexOf(arg));
    const data = this._data.map((row) => indices.map((index) => row[index]));
    const columns = indices.map((index) => this._columns[index]);
    return new QvdDataFrame(data, columns);
  }

  /**
   * Returns the data frame as a dictionary.
   *
   * @return {{columns: Array<string>, data: Array<Array<any>>}} The data frame as a dictionary.
   */
  toDict() {
    return {columns: this._columns, data: this._data};
  }

  /**
   * Loads a QVD file and returns its data frame.
   *
   * @param {string} path The path to the QVD file.
   * @return {Promise<QvdDataFrame>} The data frame of the QVD file.
   */
  static async fromQvd(path) {
    return await new QvdFileReader(path).load();
  }

  /**
   * Constructs a data frame from a dictionary.
   *
   * @param {{columns: Array<string>, data: Array<Array<any>>}} data The dictionary to construct the data frame from.
   * @return {Promise<QvdDataFrame>} The constructed data frame.
   */
  static async fromDict(data) {
    return new QvdDataFrame(data.data, data.columns);
  }
}

/**
 * QVD file parser that loads and parses a QVD file.
 */
export class QvdFileReader {
  /**
   * Constructs a new QVD file parser.
   *
   * @param {string} path The path to the QVD file to load.
   */
  constructor(path) {
    this._path = path;
    this._buffer = null;
    this._headerOffset = null;
    this._symbolTableOffset = null;
    this._indexTableOffset = null;

    /**
     * The parsed XML header of the QVD file.
     *
     * @type {QvdHeader|null}
     * @internal
     */
    this._header = null;

    /**
     * The parsed symbol table of the QVD file.
     *
     * @type {QvdSymbolTable|null}
     * @internal
     */
    this._symbolTable = null;

    /**
     * The parsed index table of the QVD file.
     *
     * @type {QvdIndexTable|null}
     * @internal
     */
    this._indexTable = null;
  }

  /**
   * Reads the binary data of the QVD file. This method is part of the parsing process
   * and should not be called directly.
   */
  async _readData() {
    const fd = await fs.promises.open(this._path, 'r');
    this._buffer = await fs.promises.readFile(fd);
    fd.close();
  }

  /**
   * Parses the XML header of the QVD file. This method is part of the parsing process
   * and should not be called directly.
   */
  async _parseHeader() {
    if (!this._buffer) {
      throw new Error('The QVD file has not been loaded in the proper order or has not been loaded at all.');
    }

    const HEADER_DELIMITER = '\r\n\0';

    const headerBeginIndex = 0;
    const headerDelimiterIndex = this._buffer.indexOf(HEADER_DELIMITER, headerBeginIndex);

    if (!headerDelimiterIndex) {
      throw new Error('The XML header section does not exist or is not properly delimited from the binary data.');
    }

    const headerEndIndex = headerDelimiterIndex + HEADER_DELIMITER.length;
    const headerBuffer = this._buffer.subarray(headerBeginIndex, headerEndIndex);

    /*
     * The following instruction parses the XML header into a JSON object. It is important to
     * note that the object is a plain JavaScript object and not an instance of representative
     * class. Hence, types are not casted, therefore all raw values are strings, and child nodes
     * that contain an array of objects are not represented directly as an array but as an object
     * with a property, named like the array item tag, that is an array of the actual objects. The
     * same applies to child nodes that contain a single object and the root node.
     *
     * The following XML representation of the QVD header for example...
     *
     *  <QvdTableHeader>
     *    ...
     *    <Fields>
     *      <QvdFieldHeader>
     *        <FieldName>Field1</FieldName>
     *        ...
     *      </QvdFieldHeader>
     *      <QvdFieldHeader>
     *        <FieldName>Field1</FieldName>
     *        ...
     *      </QvdFieldHeader>
     *    </Fields>
     *  </QvdTableHeader>
     *
     * ...is parsed into the following object:
     *
     *  {
     *    QvdTableHeader: {
     *      ...,
     *      Fields: {
     *        QvdFieldHeader: [
     *          { FieldName: 'Field1', ...},
     *          { FieldName: 'Field2', ...}
     *        ]
     *      }
     *    }
     *  }
     */

    this._header = await xml.parseStringPromise(headerBuffer.toString(), {explicitArray: false});

    if (!this._header) {
      throw new Error('The XML header could not be parsed.');
    }

    /*
     * Because the three parts of the QVD file, header, symbol and index table, are seamlessly concatenated,
     * the end of the respective previous part is the beginning of the next part.
     */

    this._headerOffset = headerBeginIndex;
    this._symbolTableOffset = headerEndIndex;
    this._indexTableOffset = this._symbolTableOffset + parseInt(this._header['QvdTableHeader']['Offset'], 10);
  }

  /**
   * Parses the symbol table of the QVD file. This method is part of the parsing process
   * and should not be called directly.
   */
  async _parseSymbolTable() {
    if (!this._buffer || !this._header || !this._symbolTableOffset || !this._indexTableOffset) {
      throw new Error('The QVD file has not been loaded in the proper order or has not been loaded at all.');
    }

    const fields = this._header['QvdTableHeader']['Fields']['QvdFieldHeader'];
    const symbolBuffer = this._buffer.subarray(this._symbolTableOffset, this._indexTableOffset);

    /*
     * The symbol table is a contiguous byte array that contains all possible symbols/values of all fields/columns.
     * The symbols/values of one field are stored consecutively in the same order as the fields/columns are defined
     * in the header. The length of the symbol area as well as it's offset, relativ to the begin of the symbol
     * table, are also defined in the header.
     */

    // Parse all possible symbols of each field/column
    this._symbolTable = fields.map((field) => {
      const symbolsOffset = parseInt(field['Offset'], 10); // Offset of the column's symbol area in the symbol table
      const symbolsLength = parseInt(field['Length'], 10); // Length of the column's symbol area in the symbol table

      const symbols = [];

      // Parse all possible values of the current field/column
      for (let pointer = symbolsOffset; pointer < symbolsOffset + symbolsLength; pointer++) {
        // Each stored symbol consists of a type byte and the actual value, which length depends on the type
        const typeByte = symbolBuffer[pointer++];

        switch (typeByte) {
          case 1: {
            // Integer value (4 Bytes)
            const byteData = new Int32Array(symbolBuffer.subarray(pointer, pointer + 4));
            const value = Buffer.from(byteData).readIntLE(0, byteData.length);

            pointer += 3;
            symbols.push(QvdSymbol.fromIntValue(value));

            break;
          }
          case 2: {
            // Double value (8 Bytes)
            const byteData = new Int32Array(symbolBuffer.subarray(pointer, pointer + 8));
            const value = Buffer.from(byteData).readDoubleLE(0);

            pointer += 7;
            symbols.push(QvdSymbol.fromDoublValue(value));

            break;
          }
          case 4: {
            // String value (0 terminated)
            let value = '';

            while (symbolBuffer[pointer] !== 0) {
              value += String.fromCharCode(symbolBuffer[pointer++]);
            }

            symbols.push(QvdSymbol.fromStringValue(value));

            break;
          }
          case 5: {
            // Dual (Integer format) value (4 bytes), followed by string format
            const byteData = new Int32Array(symbolBuffer.subarray(pointer, pointer + 4));
            const intValue = Buffer.from(byteData).readIntLE(0, byteData.length);

            pointer += 4;

            let stringValue = '';

            while (symbolBuffer[pointer] !== 0) {
              stringValue += String.fromCharCode(symbolBuffer[pointer++]);
            }

            symbols.push(QvdSymbol.fromDualIntValue(intValue, stringValue));

            break;
          }

          case 6: {
            // Dual (Double format) value (8 bytes), followed by string format
            const byteData = new Int32Array(symbolBuffer.subarray(pointer, pointer + 8));
            const doubleValue = Buffer.from(byteData).readDoubleLE(0);

            pointer += 8;

            let stringValue = '';

            while (symbolBuffer[pointer] !== 0) {
              stringValue += String.fromCharCode(symbolBuffer[pointer++]);
            }

            symbols.push(QvdSymbol.fromDualDoubleValue(doubleValue, stringValue));

            break;
          }
          default: {
            throw new Error('Unknown data type: ' + typeByte.toString(16));
          }
        }
      }

      return symbols;
    });
  }

  /**
   * Utility method to convert a bit array to an integer value.
   *
   * @param {Array} bits The bit array
   * @return {Number} The integer value
   */
  _convertBitsToInt32(bits) {
    if (bits.length === 0) {
      return 0;
    }

    return bits.reduce((value, bit, index) => (value += bit * Math.pow(2, index)), 0);
  }

  /**
   * Parses the bit stuffed index table of the QVD file. This method is part of the parsing process
   * and should not be called directly.
   */
  async _parseIndexTable() {
    if (!this._buffer || !this._header || !this._indexTableOffset) {
      throw new Error('The QVD file has not been loaded in the proper order or has not been loaded at all.');
    }

    const fields = this._header['QvdTableHeader']['Fields']['QvdFieldHeader'];

    // Size of a single row of the index table in bytes
    const recordSize = parseInt(this._header['QvdTableHeader']['RecordByteSize'], 10);

    const indexBuffer = this._buffer.subarray(
      this._indexTableOffset,
      this._indexTableOffset + parseInt(this._header['QvdTableHeader']['Length'], 10) + 1,
    );

    this._indexTable = [];

    // Parse all rows of the index table, each row contains the indices of the symbol table for each field/column
    for (let pointer = 0; pointer < indexBuffer.length; pointer += recordSize) {
      const bytes = new Int32Array(indexBuffer.subarray(pointer, pointer + recordSize));
      bytes.reverse();

      // The bit mask contains the bit stuffed indices of the symbol table of the current row
      const mask = bytes
        .reduce((bits, byte) => bits + ('00000000' + byte.toString(2)).slice(-8), '')
        .split('')
        .reverse()
        .map((bit) => parseInt(bit));

      const symbolIndices = [];

      // Extract the index from the current row's bit mask for each field/column
      fields.forEach((field) => {
        const bitOffset = parseInt(field['BitOffset'], 10);
        const bitWidth = parseInt(field['BitWidth'], 10);
        const bias = parseInt(field['Bias'], 10);

        let symbolIndex;

        if (bitWidth === 0) {
          symbolIndex = 0;
        } else {
          symbolIndex = this._convertBitsToInt32(mask.slice(bitOffset, bitOffset + bitWidth));
        }

        symbolIndex += bias;
        symbolIndices.push(symbolIndex);
      });

      this._indexTable.push(symbolIndices);
    }
  }

  /**
   * Loads the QVD file into memory and parses it.
   *
   * @return {Promise<QvdDataFrame>} The loaded QVD file.
   */
  async load() {
    await this._readData();
    await this._parseHeader();
    await this._parseSymbolTable();
    await this._parseIndexTable();

    /**
     * Retrieves the values of a specific row of the QVD file. Values are in the same order
     * as the field names.
     *
     * @param {number} index The index of the row.
     * @return {Array<any>} The values of the row.
     */
    const getRow = (index) => {
      assert(this._indexTable, 'The QVD file index table has not been parsed.');

      if (index >= this._indexTable.length) {
        throw new Error('Index is out of bounds');
      }

      return this._indexTable[index]
        .map((symbolIndex, fieldIndex) => this._symbolTable?.[fieldIndex][symbolIndex])
        .map((symbol) => symbol?.toPrimaryValue());
    };

    assert(this._header, 'The QVD file header has not been parsed.');
    assert(this._symbolTable, 'The QVD file symbol table has not been parsed.');
    assert(this._indexTable, 'The QVD file index table has not been parsed.');

    const columns = this._header['QvdTableHeader']['Fields']['QvdFieldHeader'].map((field) => field['FieldName']);
    const data = this._indexTable.map((_, index) => getRow(index));

    return new QvdDataFrame(data, columns);
  }
}
