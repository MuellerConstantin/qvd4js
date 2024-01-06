# qvd4js

> Utility library for reading Qlik View Data (QVD) files in JavaScript.

The _qvd4js_ library provides a simple API for reading Qlik View Data (QVD) files in JavaScript. Using
this library, it is possible to parse the binary QVD file format and convert it to a JavaScript object
structure. The library is written to be used in a Node.js environment exclusively.

---

- [Usage](#usage)
- [API Documentation](#api-documentation)
  - [`QvdFile`](#qvdfile)
    - [`QvdFile(path: string, header: QvdHeader, symbolTable: QvdSymbolTable, indexTable: QvdIndexTable)`](#qvdfilepath-string-header-qvdheader-symboltable-qvdsymboltable-indextable-qvdindextable)
    - [`QvdFile.load(path: string): Promise<QvdFile>` (static)](#qvdfileloadpath-string-promiseqvdfile-static)
    - [`QvdFile.getRow(index: number): Array<any>`](#qvdfilegetrowindex-number-arrayany)
    - [`QvdFile.getTable(): {columns: Array<string>, data: Array<Array<any>>}`](#qvdfilegettable-columns-arraystring-data-arrayarrayany)
  - [`QvdFileParser`](#qvdfileparser)
    - [`QvdFileParser(path: string)`](#qvdfileparserpath-string)
    - [`QvdFileParser.load(): Promise<QvdFile>`](#qvdfileparserload-promiseqvdfile)
  - [`QvdSymbol`](#qvdsymbol)
    - [`QvdSymbol(intValue: number|null, doubleValue: number|null, stringValue: string|null)`](#qvdsymbolintvalue-numbernull-doublevalue-numbernull-stringvalue-stringnull)
    - [`QvdSymbol.toPrimaryValue(): number|string|null`](#qvdsymboltoprimaryvalue-numberstringnull)
    - [`QvdSymbol.fromIntValue(value: number): QvdSymbol` (static)](#qvdsymbolfromintvaluevalue-number-qvdsymbol-static)
    - [`QvdSymbol.fromDoubleValue(value: number): QvdSymbol` (static)](#qvdsymbolfromdoublevaluevalue-number-qvdsymbol-static)
    - [`QvdSymbol.fromStringValue(value: string): QvdSymbol` (static)](#qvdsymbolfromstringvaluevalue-string-qvdsymbol-static)
    - [`QvdSymbol.fromDualIntValue(intValue: number, stringValue: string): QvdSymbol` (static)](#qvdsymbolfromdualintvalueintvalue-number-stringvalue-string-qvdsymbol-static)
    - [`QvdSymbol.fromDualDoubleValue(doubleValue: number, stringValue: string): QvdSymbol` (static)](#qvdsymbolfromdualdoublevaluedoublevalue-number-stringvalue-string-qvdsymbol-static)
- [License](#license)
  - [Forbidden](#forbidden)

---

## Usage

First off, install _qvd4js_ using npm:

```bash
npm install qvd4js
```

Then, import the library into your project. The following example shows how to read a QVD file and convert it to a JavaScript object:

```javascript
import {QvdFile} from 'qvd4js';

const qvdFile = await QvdFile.load('path/to/file.qvd');
```

## API Documentation

### `QvdFile`

The class `QvdFile` represents a finally parsed QVD file. It provides abstracted access to the QVD file's header and data section.
This includes meta information as well as access to the actual data records. It is important to note that the `QvdFile` class
does not actually parse the QVD file. Instead, the class is just used to create a high-level abstraction of the information
stored in the QVD file.

| Property       | Type     | Description                                                         |
| -------------- | -------- | ------------------------------------------------------------------- |
| `path`         | `string` | The path to the QVD file that was parsed.                           |
| `numberOfRows` | `number` | The number of data records/rows that are contained in the QVD file. |
| `fieldNames`   | `string` | The names of the fields that are contained in the QVD file.         |

#### `QvdFile(path: string, header: QvdHeader, symbolTable: QvdSymbolTable, indexTable: QvdIndexTable)`

The constructor is only documented for completeness and should not be used directly. The constructor of the `QvdFile` class takes
the already parsed parts of the QVD file as its arguments. Instead it is recommended to use the static
[`QvdFile.load`](#qvdfileloadpath-string-promiseqvdfile-static) method to load and parse a QVD file.

#### `QvdFile.load(path: string): Promise<QvdFile>` (static)

The static method `QvdFile.load` loads a QVD file from the given path and parses it. The method returns a promise that resolves
to a `QvdFile` instance. Under the hood, the method uses an instance of the `QvdFileParser` class to read the QVD file.

#### `QvdFile.getRow(index: number): Array<any>`

The method `QvdFile.getRow` returns the data record at the given index. The method returns a promise that resolves to an array
of values. The order of the values in the array corresponds to the order of the fields in the QVD file.

#### `QvdFile.getTable(): {columns: Array<string>, data: Array<Array<any>>}`

The method `QvdFile.getTable` returns the entire data table of the QVD file. The method returns a promise that resolves to an
object with the columns and the actual data as properties. The columns property is an array of strings that contains the names
of the fields in the QVD file. The data property is an array of arrays that contains the actual data records. The order of the
values in the inner arrays corresponds to the order of the fields in the QVD file.

### `QvdFileParser`

The class `QvdFileParser` is used to read and parse a QVD file. It contains the actual logic for reading the QVD file and
converting it to a JavaScript object structure. The class is primarily used internally by the `QvdFile` class.

#### `QvdFileParser(path: string)`

The constructor of the `QvdFileParser` class takes the path to the QVD file that should be parsed as its only argument. It is
important to note that the constructor does not actually read the file. Instead, the parser is just initialized with the given
path.

#### `QvdFileParser.load(): Promise<QvdFile>`

The method `QvdFileParser.load` reads the QVD file that was passed to the constructor and parses it. The method returns a
promise that resolves to a `QvdFile` instance.

### `QvdSymbol`

The class `QvdSymbol` represents a symbol/value in the QVD file. A symbol is either a raw value (`string`, `integer`, `double`) or a
dual value, which is a combination of a `string` value and a `number` or `double` value. This class is also mainly used internally
by the `QvdFile` class to hold the symbol table of the QVD file. In general, all API methods return the underlying raw values of
the symbols and not the `QvdSymbol` instances themselves.

| Property      | Type     | Description                                                                                  |
| ------------- | -------- | -------------------------------------------------------------------------------------------- |
| `intValue`    | `number` | The integer value of the symbol. Only available if the symbol has an integer representation. |
| `doubleValue` | `number` | The double value of the symbol. Only available if the symbol has a double representation.    |
| `stringValue` | `string` | The string value of the symbol. Only available if the symbol has a string representation.    |

#### `QvdSymbol(intValue: number|null, doubleValue: number|null, stringValue: string|null)`

Constructs a new `QvdSymbol` instance with the given values.

#### `QvdSymbol.toPrimaryValue(): number|string|null`

Returns the primary value of the symbol. The primary value is the value that is used to represent the symbol. In case of a dual
value, the string value is returned. In case of a raw value, the raw value itself is returned.

#### `QvdSymbol.fromIntValue(value: number): QvdSymbol` (static)

Constructs a new `QvdSymbol` instance from the given integer value.

#### `QvdSymbol.fromDoubleValue(value: number): QvdSymbol` (static)

Constructs a new `QvdSymbol` instance from the given double value.

#### `QvdSymbol.fromStringValue(value: string): QvdSymbol` (static)

Constructs a new `QvdSymbol` instance from the given string value.

#### `QvdSymbol.fromDualIntValue(intValue: number, stringValue: string): QvdSymbol` (static)

Constructs a new dual `QvdSymbol` instance from the given integer and string values.

#### `QvdSymbol.fromDualDoubleValue(doubleValue: number, stringValue: string): QvdSymbol` (static)

Constructs a new dual `QvdSymbol` instance from the given double and string values.

## License

Copyright (c) 2024 Constantin Müller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[MIT License](https://opensource.org/licenses/MIT) or [LICENSE](LICENSE) for
more details.

### Forbidden

**Hold Liable**: Software is provided without warranty and the software
author/license owner cannot be held liable for damages.
