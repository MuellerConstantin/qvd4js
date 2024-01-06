// @ts-check

import fs from 'fs';
import xml from 'xml2js';
import {QvdValue} from './qvd-value';

/**
 * @typedef {{[name: string]: any}} QvdHeader
 *
 * The header contains the meta data of the QVD file. It is a plain JavaScript object
 * that is parsed from the XML header of the QVD file. It is important to note that the
 * object is a plain JavaScript object and not an instance of representative class. For
 * more information see the documentation of the parser implementation in
 * {@link QvdFileBuilder._parseHeader|QvdFileBuilder}.
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
 * Represents a loaded QVD file.
 */
export class QvdFile {
  /**
   * Constructs a new QVD file.
   *
   * @param {string} path The path to the QVD file.
   * @param {QvdHeader} header The parsed XML header of the QVD file.
   * @param {QvdSymbolTable} symbolTable The symbol table of the QVD file.
   * @param {QvdIndexTable} indexTable The index table of the QVD file.
   */
  constructor(path, header, symbolTable, indexTable) {
    /**
     * The path to the QVD file.
     *
     * @type {string}
     * @internal
     */
    this._path = path;

    /**
     * The parsed XML header of the QVD file.
     *
     * @type {QvdHeader}
     * @internal
     */
    this._header = header;

    /**
     * The symbol table of the QVD file.
     *
     * @type {QvdSymbolTable}
     * @internal
     */
    this._symbolTable = symbolTable;

    /**
     * The index table of the QVD file.
     *
     * @type {QvdIndexTable}
     * @internal
     */
    this._indexTable = indexTable;
  }

  /**
   * Retieves the path to the QVD file.
   *
   * @return {string} The path to the QVD file.
   */
  get path() {
    return this._path;
  }

  /**
   * Retrieves the field names of the QVD file.
   *
   * @return {Array<string>} The field names.
   */
  get fieldNames() {
    return this._header['QvdTableHeader']['Fields']['QvdFieldHeader'].map((field) => field['FieldName']);
  }

  /**
   * Retrieves the total number of rows of the QVD file
   *
   * @return {number} The number of rows.
   */
  get numberOfRows() {
    return parseInt(this._header['QvdTableHeader']['NoOfRecords'], 10);
  }

  /**
   * Retrieves the values of a specific row of the QVD file. Values are in the same order
   * as the field names.
   *
   * @param {number} index The index of the row.
   * @return {Array<any>} The values of the row.
   */
  getRow(index) {
    if (index >= this.numberOfRows) {
      throw new Error('Index is out of bounds');
    }

    return this._indexTable[index]
      .map((symbolIndex, fieldIndex) => this._symbolTable[fieldIndex][symbolIndex])
      .map((symbol) => symbol?.toPrimaryValue());
  }

  /**
   * Retrieves the values of all rows of the QVD file as an array of row values. Each row
   * is an array of values in the same order as the field names.
   *
   * @return {{columns: Array<string>, data: Array<Array<any>>}} The columns and the data per row.
   */
  getTable() {
    const data = [];

    for (let index = 0; index < this.numberOfRows; index++) {
      data.push(this.getRow(index));
    }

    return {
      columns: this.fieldNames,
      data,
    };
  }

  /**
   * Loads a QVD file from the file system.
   *
   * @param {string} path The path to the QVD file to load.
   * @return {Promise<QvdFile>} The loaded QVD file.
   * @static
   */
  static async load(path) {
    const builder = new QvdFileBuilder(path);
    return await builder.load();
  }
}

/**
 * QVD file builder that loads and parses a QVD file.
 */
export class QvdFileBuilder {
  /**
   * Constructs a new QVD file builder.
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
            symbols.push(QvdValue.fromIntValue(value));

            break;
          }
          case 2: {
            // Double value (8 Bytes)
            const byteData = new Int32Array(symbolBuffer.subarray(pointer, pointer + 8));
            const value = Buffer.from(byteData).readDoubleLE(0);

            pointer += 7;
            symbols.push(QvdValue.fromDoublValue(value));

            break;
          }
          case 4: {
            // String value (0 terminated)
            let value = '';

            while (symbolBuffer[pointer] !== 0) {
              value += String.fromCharCode(symbolBuffer[pointer++]);
            }

            symbols.push(QvdValue.fromStringValue(value));

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

            symbols.push(QvdValue.fromDualIntValue(intValue, stringValue));

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

            symbols.push(QvdValue.fromDualDoubleValue(doubleValue, stringValue));

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
   * @return {Promise<QvdFile>} The loaded QVD file.
   */
  async load() {
    await this._readData();
    await this._parseHeader();
    await this._parseSymbolTable();
    await this._parseIndexTable();

    return new QvdFile(
      this._path,
      /** @type {QvdHeader} */ (this._header),
      /** @type {QvdSymbolTable} */ (this._symbolTable),
      /** @type {QvdIndexTable} */ (this._indexTable),
    );
  }
}
