import fs from 'fs';
import xml from 'xml2js';
import QvdValue from './QvdValue.js';

/**
 * Represents a loaded QVD file.
 */
export default class QvdFile {
  /**
   * Constructs a new QVD file.
   *
   * @param {String} path The path to the QVD file.
   * @param {object} header The header of the QVD file.
   * @param {Array<Array<any>>} symbolTable The symbol table of the QVD file.
   * @param {Array<Array<Number>>} indexTable The index table of the QVD file.
   */
  constructor(path, header, symbolTable, indexTable) {
    this._path = path;
    this._header = header;
    this._symbolTable = symbolTable;
    this._indexTable = indexTable;
  }

  /**
   * Retieves the path to the QVD file.
   */
  get path() {
    return this._path;
  }

  /**
   * Retrieves the field names of the QVD file.
   */
  get fieldNames() {
    return this._header['QvdTableHeader']['Fields']['QvdFieldHeader'].map((field) => field['FieldName']);
  }

  /**
   * Retrieves the total number of rows of the QVD file.
   */
  get numberOfRows() {
    return parseInt(this._header['QvdTableHeader']['NoOfRecords'], 10);
  }

  /**
   * Retrieves the values of a specific row of the QVD file. Values are in the same order
   * as the field names.
   *
   * @param {Number} index The index of the row.
   * @return {Array} The values of the row.
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
   * @return {object} The data and columns of the table.
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
   * @param {String} path The path to the QVD file to load.
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
   * @param {String} path The path to the QVD file to load.
   */
  constructor(path) {
    this._path = path;
    this._buffer = null;
    this._headerOffset = null;
    this._symbolTableOffset = null;
    this._indexTableOffset = null;
    this._header = null;
    this._symbolTable = null;
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
    const HEADER_DELIMITER = '\r\n\0';

    const headerBeginIndex = 0;
    const headerDelimiterIndex = this._buffer.indexOf(HEADER_DELIMITER, headerBeginIndex);

    if (-1 === headerDelimiterIndex) {
      throw new Error('The XML header section does not exist or is not properly delimited from the binary data');
    }

    const headerEndIndex = headerDelimiterIndex + HEADER_DELIMITER.length;
    const headerBuffer = this._buffer.subarray(headerBeginIndex, headerEndIndex);

    this._header = await xml.parseStringPromise(headerBuffer.toString(), {
      explicitArray: false,
    });

    this._headerOffset = headerBeginIndex;
    this._symbolTableOffset = headerEndIndex;
    this._indexTableOffset = this._symbolTableOffset + parseInt(this._header['QvdTableHeader']['Offset'], 10);
  }

  /**
   * Parses the symbol table of the QVD file. This method is part of the parsing process
   * and should not be called directly.
   */
  async _parseSymbolTable() {
    const fields = this._header['QvdTableHeader']['Fields']['QvdFieldHeader'];
    const symbolBuffer = this._buffer.subarray(this._symbolTableOffset, this._indexTableOffset);

    this._symbolTable = fields.map((field) => {
      const symbolsOffset = parseInt(field['Offset'], 10);
      const symbolsLength = parseInt(field['Length'], 10);

      const symbols = [];

      for (let pointer = symbolsOffset; pointer < symbolsOffset + symbolsLength; pointer++) {
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
    const fields = this._header['QvdTableHeader']['Fields']['QvdFieldHeader'];
    const recordSize = parseInt(this._header['QvdTableHeader']['RecordByteSize'], 10);

    const indexBuffer = this._buffer.subarray(
      this._indexTableOffset,
      this._indexTableOffset + parseInt(this._header['QvdTableHeader']['Length'], 10) + 1,
    );

    this._indexTable = [];

    for (let pointer = 0; pointer < indexBuffer.length; pointer += recordSize) {
      const bytes = new Int32Array(indexBuffer.subarray(pointer, pointer + recordSize));
      bytes.reverse();

      const mask = bytes
        .reduce((bits, byte) => bits + ('00000000' + byte.toString(2)).slice(-8), '')
        .split('')
        .reverse()
        .map((bit) => parseInt(bit));

      const symbolIndices = [];

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

    return new QvdFile(this._path, this._header, this._symbolTable, this._indexTable);
  }
}
