// @ts-check

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import xml from 'xml2js';
import assert from 'assert';

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
   * Converts the symbol to its byte representation.
   *
   * @return {Buffer} The byte representation of the symbol.
   */
  toByteRepresentation() {
    if (this._intValue && this._stringValue) {
      const intBuffer = Buffer.alloc(4);
      intBuffer.writeInt32LE(this._intValue);

      const stringBuffer = Buffer.concat([Buffer.from(this._stringValue, 'utf-8'), Buffer.from([0])]);

      return Buffer.concat([Buffer.from([5]), intBuffer, stringBuffer]);
    } else if (this._doubleValue && this._stringValue) {
      const floatBuffer = Buffer.alloc(8);
      floatBuffer.writeDoubleLE(this._doubleValue);

      const stringBuffer = Buffer.concat([Buffer.from(this._stringValue, 'utf-8'), Buffer.from([0])]);

      return Buffer.concat([Buffer.from([6]), floatBuffer, stringBuffer]);
    } else if (this._intValue) {
      const buffer = Buffer.alloc(4);
      buffer.writeInt32LE(this._intValue);

      return Buffer.concat([Buffer.from([1]), buffer]);
    } else if (this._doubleValue) {
      const buffer = Buffer.alloc(8);
      buffer.writeDoubleLE(this._doubleValue);

      return Buffer.concat([Buffer.from([2]), buffer]);
    } else if (this._stringValue) {
      const buffer = Buffer.concat([Buffer.from(this._stringValue, 'utf-8'), Buffer.from([0])]);

      return Buffer.concat([Buffer.from([4]), buffer]);
    } else {
      throw new Error('The symbol does not contain any value.');
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
  static fromDoubleValue(doubleValue) {
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
   * @return {Promise<{columns: Array<string>, data: Array<Array<any>>}>} The data frame as a dictionary.
   */
  async toDict() {
    return {columns: this._columns, data: this._data};
  }

  /**
   * Persists the data frame to a QVD file.
   *
   * @param {string} path The path to the QVD file.
   */
  async toQvd(path) {
    new QvdFileWriter(path, this).save();
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
    assert(data.columns, 'The dictionary to construct the data frame from does not contain any columns.');
    assert(data.data, 'The dictionary to construct the data frame from does not contain any data.');

    return new QvdDataFrame(data.data, data.columns);
  }
}

/**
 * Parses a QVD file and loads it into memory.
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

    let fields = this._header['QvdTableHeader']['Fields']['QvdFieldHeader'];
    const symbolBuffer = this._buffer.subarray(this._symbolTableOffset, this._indexTableOffset);

    if (!Array.isArray(fields)) {
      fields = [fields];
    }

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
            symbols.push(QvdSymbol.fromDoubleValue(value));

            break;
          }
          case 4: {
            // String value (0 terminated)
            const byteData = [];

            while (symbolBuffer[pointer] !== 0) {
              byteData.push(symbolBuffer[pointer++]);
            }

            const value = Buffer.from(byteData).toString('utf-8');
            symbols.push(QvdSymbol.fromStringValue(value));

            break;
          }
          case 5: {
            // Dual (Integer format) value (4 bytes), followed by string format
            const intByteData = new Int32Array(symbolBuffer.subarray(pointer, pointer + 4));
            const intValue = Buffer.from(intByteData).readIntLE(0, intByteData.length);

            pointer += 4;

            let stringByteData = [];

            while (symbolBuffer[pointer] !== 0) {
              stringByteData.push(symbolBuffer[pointer++]);
            }

            const stringValue = Buffer.from(stringByteData).toString('utf-8');
            symbols.push(QvdSymbol.fromDualIntValue(intValue, stringValue));

            break;
          }

          case 6: {
            // Dual (Double format) value (8 bytes), followed by string format
            const doubleByteData = new Int32Array(symbolBuffer.subarray(pointer, pointer + 8));
            const doubleValue = Buffer.from(doubleByteData).readDoubleLE(0);

            pointer += 8;

            let stringByteData = [];

            while (symbolBuffer[pointer] !== 0) {
              stringByteData.push(symbolBuffer[pointer++]);
            }

            const stringValue = Buffer.from(stringByteData).toString('utf-8');
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

    let fields = this._header['QvdTableHeader']['Fields']['QvdFieldHeader'];

    if (!Array.isArray(fields)) {
      fields = [fields];
    }

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

    assert(this._header, 'The QVD file header has not been parsed.');
    assert(this._symbolTable, 'The QVD file symbol table has not been parsed.');
    assert(this._indexTable, 'The QVD file index table has not been parsed.');

    /**
     * Retrieves the values of a specific row of the QVD file. Values are in the same order
     * as the field names.
     *
     * @param {number} index The index of the row.
     * @return {Array<any>} The values of the row.
     */
    const getRow = (index) => {
      if (!this._indexTable || index >= this._indexTable.length) {
        throw new Error('Index is out of bounds');
      }

      return this._indexTable?.[index]
        .map((symbolIndex, fieldIndex) => this._symbolTable?.[fieldIndex][symbolIndex])
        .map((symbol) => {
          const value = symbol?.toPrimaryValue();

          if (typeof value === 'string') {
            if (!isNaN(Number(value))) {
              return Number(value);
            }
          }

          return value;
        });
    };

    let fields = this._header['QvdTableHeader']['Fields']['QvdFieldHeader'];

    if (!Array.isArray(fields)) {
      fields = [fields];
    }

    const columns = fields.map((field) => field['FieldName']);
    const data = this._indexTable.map((_, index) => getRow(index));

    return new QvdDataFrame(data, columns);
  }
}

/**
 * Persists a QVD file to disk.
 */
export class QvdFileWriter {
  /**
   * Constructs a new QVD file writer.
   *
   * @param {string} path The path to the QVD file to write.
   * @param {QvdDataFrame} df The data frame to write to the QVD file.
   */
  constructor(path, df) {
    this._path = path;
    this._df = df;
    this._header = null;
    this._symbolBuffer = null;
    this._symbolTable = null;
    this._symbolTableMetadata = null;
    this._indexBuffer = null;
    this._indexTable = null;
    this._indexTableMetadata = null;
    this._recordByteSize = null;
  }

  /**
   * Writes the data to the QVD file.
   */
  _writeData() {
    assert(this._header, 'The QVD file header has not been parsed.');
    assert(this._symbolBuffer, 'The QVD file symbol table has not been parsed.');
    assert(this._indexBuffer, 'The QVD file index table has not been parsed.');

    const headerBuffer = Buffer.concat([Buffer.from(this._header, 'utf-8'), Buffer.from([0])]);

    const fd = fs.openSync(this._path, 'w');
    fs.writeSync(fd, headerBuffer, 0, headerBuffer.length, 0);
    fs.writeSync(fd, this._symbolBuffer, 0, this._symbolBuffer.length, headerBuffer.length);
    fs.writeSync(fd, this._indexBuffer, 0, this._indexBuffer.length, headerBuffer.length + this._symbolBuffer.length);
    fs.closeSync(fd);
  }

  /**
   * Builds the XML header of the QVD file.
   */
  _buildHeader() {
    const creationDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    const xmlObject = {
      QvdTableHeader: {
        QvBuildNo: 50667,
        CreatorDoc: crypto.randomUUID(),
        CreateUtcTime: creationDate,
        SourceCreateUtcTime: '',
        SourceFileUtcTime: '',
        SourceFileSize: -1,
        StaleUtcTime: '',
        TableName: path.basename(this._path, path.extname(this._path)),
        Fields: {
          QvdFieldHeader: this._df.columns.map((column, index) => {
            return {
              FieldName: column,
              BitOffset: this._indexTableMetadata?.[index][0],
              BitWidth: this._indexTableMetadata?.[index][1],
              Bias: this._indexTableMetadata?.[index][2],
              NoOfSymbols: this._symbolTable?.[index].length,
              Offset: this._symbolTableMetadata?.[index][0],
              Length: this._symbolTableMetadata?.[index][1],
              Comment: '',
              NumberFormat: {
                Type: 'UNKNOWN',
                nDec: '0',
                UseThou: '0',
                Fmt: '',
                Dec: '',
                Thou: '',
              },
              Tags: {},
            };
          }),
        },
        NoOfRecords: this._indexTable?.length,
        RecordByteSize: this._recordByteSize,
        Offset:
          this._symbolTableMetadata?.[this._symbolTableMetadata.length - 1][0] +
          this._symbolTableMetadata?.[this._symbolTableMetadata.length - 1][1],
        Length: this._indexBuffer?.length,
        Compression: '',
        Comment: '',
        EncryptionInfo: '',
        TableTags: '',
        ProfilingData: '',
        Lineage: {
          LineageInfo: {
            Discriminator: 'INLINE;',
            Statement: '',
          },
        },
      },
    };

    const builder = new xml.Builder({
      renderOpts: {
        pretty: true,
        newline: '\r\n',
        indent: '  ',
      },
    });
    this._header = builder.buildObject(xmlObject) + '\r\n';
  }

  /**
   * Builds the symbol table of the QVD file.
   */
  _buildSymbolTable() {
    this._symbolTable = [];
    this._symbolTableMetadata = [];
    this._symbolBuffer = Buffer.alloc(0);

    this._df.columns.forEach((column) => {
      const uniqueValues = Array.from(new Set(this._df.data.map((row) => row[this._df.columns.indexOf(column)])));
      const symbols = uniqueValues.map((value) => QvdFileWriter._convertRawToSymbol(value));

      const currentSymbolBuffer = Buffer.concat(symbols.map((symbol) => symbol.toByteRepresentation()));
      this._symbolBuffer = this._symbolBuffer
        ? Buffer.concat([this._symbolBuffer, currentSymbolBuffer])
        : currentSymbolBuffer;

      const symbolsLength = currentSymbolBuffer.length;
      const symbolsOffset = this._symbolBuffer.length - symbolsLength;

      this._symbolTableMetadata?.push([symbolsOffset, symbolsLength]);
      this._symbolTable?.push(symbols);
    });
  }

  /**
   * Builds the index table of the QVD file.
   */
  _buildIndexTable() {
    this._indexTable = [];
    this._indexTableMetadata = [];
    this._indexBuffer = Buffer.alloc(0);

    this._df.data.forEach((row) => {
      // Convert the raw values to indices referring to the symbol table
      let indices = this._df.columns.map((column) => {
        const value = row[this._df.columns.indexOf(column)];
        const symbol = QvdFileWriter._convertRawToSymbol(value);
        const symbolIndex = this._symbolTable?.[this._df.columns.indexOf(column)].findIndex((s) => s.equals(symbol));
        return symbolIndex;
      });

      // Convert the integer indices to binary representation
      indices = indices.map((index) => {
        const bits = QvdFileWriter._convertInt32ToBits(index, 32);
        let bitString = bits.join('');
        bitString = bitString.replace(/^0+/, '') || '0';
        return bitString;
      });

      this._indexTable?.push(indices);
    });

    // Normalize the bit representation of the indices by padding with zeros
    this._df.columns.forEach((column) => {
      // Bit offset is the sum of the bit widths of all previous columns
      const bitOffset = this._indexTableMetadata
        ?.slice(0, this._df.columns.indexOf(column))
        .reduce((sum, metadata) => sum + metadata[1], 0);

      assert(this._indexTable, 'The QVD file header has not been parsed.');

      // Bit width is the maximum bit width of all indices of the column
      const bitWidth = Math.max(
        ...this._indexTable.map((/** @type{string[]} */ indices) => indices[this._df.columns.indexOf(column)].length),
      );

      const bias = 0;

      this._indexTableMetadata?.push([bitOffset, bitWidth, bias]);

      // Pad the bit representation of the indices with zeros to match the bit width
      this._indexTable.forEach((/** @type{string[]} */ indices) => {
        const bitString = indices[this._df.columns.indexOf(column)];
        const paddedBitString = bitString.padStart(bitWidth, '0');
        indices[this._df.columns.indexOf(column)] = paddedBitString;
      });
    });

    // Concatenate the bit representation of the indices of each row to a single binary string per row
    this._indexBuffer = Buffer.concat(
      this._indexTable.map((/** @type{string[]} */ indices) => {
        indices.reverse();
        const bits = indices.join('');
        const paddingWidth = (8 - (bits.length % 8)) % 8;
        const paddedBits = bits.padStart(bits.length + paddingWidth, '0');
        const bytes = paddedBits.match(/.{1,8}/g)?.map((byte) => parseInt(byte, 2));
        bytes?.reverse();

        assert(bytes, 'Byte conversion of bit indices failed.');

        return Buffer.from(Uint8Array.from(bytes));
      }),
    );

    this._recordByteSize = this._indexBuffer.length / this._indexTable.length;
  }

  /**
   * Converts a raw value/literal to a QVD symbol.
   *
   * @param {any} raw The raw value/literal to convert.
   * @return {QvdSymbol} The converted QVD symbol.
   */
  static _convertRawToSymbol(raw) {
    const isInteger = typeof raw === 'number' && Number.isInteger(raw);
    const isFloat = typeof raw === 'number' && !Number.isInteger(raw);

    if (isInteger) {
      return QvdSymbol.fromDualIntValue(raw, raw.toString());
    } else if (isFloat) {
      return QvdSymbol.fromDualDoubleValue(raw, raw.toString());
    } else {
      return QvdSymbol.fromStringValue(raw);
    }
  }

  /**
   * Converts an integer to a list of bits.
   *
   * @param {number} value The integer value to convert.
   * @param {number} width The width of the bit list.
   * @return {Array<number>} The list of bits.
   */
  static _convertInt32ToBits(value, width) {
    return value
      .toString(2)
      .split('')
      .map((bit) => parseInt(bit))
      .reverse()
      .concat(new Array(width).fill(0))
      .slice(0, width)
      .reverse();
  }

  /**
   * Persists the data frame to a QVD file.
   */
  save() {
    this._buildSymbolTable();
    this._buildIndexTable();
    this._buildHeader();
    this._writeData();
  }
}
