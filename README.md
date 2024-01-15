# qvd4js

> Utility library for reading Qlik View Data (QVD) files in JavaScript.

The _qvd4js_ library provides a simple API for reading Qlik View Data (QVD) files in JavaScript. Using
this library, it is possible to parse the binary QVD file format and convert it to a JavaScript object
structure. The library is written to be used in a Node.js environment exclusively.

---

- [Install](#install)
- [Usage](#usage)
- [API Documentation](#api-documentation)
  - [QvdFile](#qvdfile)
    - [`static load(path: string): Promise<QvdFile>`](#static-loadpath-string-promiseqvdfile)
    - [`getRow(index: number): Array<any>`](#getrowindex-number-arrayany)
    - [`getTable(): {columns: Array<string>, data: Array<Array<any>>}`](#gettable-columns-arraystring-data-arrayarrayany)
- [License](#license)
  - [Forbidden](#forbidden)

---

## Install

_qvd4js_ is a Node.js module available through [npm](https://www.npmjs.com/). The recommended way to install and maintain _qvd4js_ as a dependency is through the Node.js Package Manager (NPM).
Before installing this library, download and install Node.js.

You can get _qvd4js_ using the following command:

```bash
npm install qvd4js --save
```

## Usage

Below is a quick example how to use _qvd4js_.

```javascript
import {QvdFile} from 'qvd4js';

const qvdFile = await QvdFile.load('path/to/file.qvd');
const dataTable = qvdFile.getTable();
```

The above example loads the _qvd4js_ module and parses an example QVD file. A QVD file is typically loaded using the static
`QvdFile.load` function of the `QvdFile` class itself. After loading the file's content, numerous methods and properties
are available to work with the parsed data.

## QVD File Format

The QVD file format is a binary file format that is used by QlikView to store data. The format is proprietary. However,
the format is well documented and can be parsed without the need of a QlikView installation. In fact, a QVD file consists
of three parts: a XML header, and two binary parts, the symbol and the index table. The XML header contains meta information
about the QVD file, such as the number of data records and the names of the fields. The symbol table contains the actual
distinct values of the fields. The index table contains the actual data records. The index table is a list of indices
which point to values in the symbol table.

### XML Header

The XML header contains meta information about the QVD file. The header is always located at the beginning of the file and
is in human readable text format. The header contains information about the number of data records, the names of the fields,
and the data types of the fields.

### Symbol Table

The symbol table contains the distinct/unique values of the fields and is located directly after the XML header. The order
of columns in the symbol table corresponds to the order of the fields in the XML header. The length and offset of the
symbol sections of each column are also stored in the XML header. Each symbol section consist of the unique symbols of the
respective column. The type of a single symbol is determined by a type byte prefixed to the respective symbol value. The
following type of symbols are supported:

| Code | Type         | Description                                                                                   |
| ---- | ------------ | --------------------------------------------------------------------------------------------- |
| 1    | Integer      | signed 4-byte integer (little endian)                                                         |
| 2    | Float        | signed 8-byte IEEE floating point number (little endian)                                      |
| 4    | String       | null terminated string                                                                        |
| 5    | Dual Integer | signed 4-byte integer (little endian) followed by a null terminated string                    |
| 6    | Dual Float   | signed 8-byte IEEE floating point number (little endian) followed by a null terminated string |

### Index Table

After the symbol table, the index table follows. The index table contains the actual data records. The index table contains
binary indices that refrences to the values of each row in the symbol table. The order of the columns in the index table
corresponds to the order of the fields in the XML header. Hence, the index table does not contain the actual values of a
data record, but only the indices that point to the values in the symbol table.

## API Documentation

### QvdFile

The `QvdFile` class represents a finally parsed QVD file. It provides a high-level abstraction access to the QVD file content.
This includes meta information as well as access to the actual data records.

| Property       | Type     | Description                                                         |
| -------------- | -------- | ------------------------------------------------------------------- |
| `path`         | `string` | The path to the QVD file that was parsed.                           |
| `numberOfRows` | `number` | The number of data records/rows that are contained in the QVD file. |
| `fieldNames`   | `string` | The names of the fields that are contained in the QVD file.         |

#### `static load(path: string): Promise<QvdFile>`

The static method `QvdFile.load` loads a QVD file from the given path and parses it. The method returns a promise that resolves
to a `QvdFile` instance.

#### `getRow(index: number): Array<any>`

The method `getRow` returns the data record at the given index. The method returns an array
of the row's values. The order of the values in the array corresponds to the order of the fields in the QVD file.

#### `getTable(): {columns: Array<string>, data: Array<Array<any>>}`

The method `getTable` returns the entire data table of the QVD file. The method returns an object with the columns and the
actual data as properties. The columns property is an array of strings that contains the names of the fields in the QVD file,
similar to the `fieldNames` property. The data property is an array of arrays that contains the actual data records. The order
of the values in the inner arrays corresponds to the order of the fields in the QVD file.

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
