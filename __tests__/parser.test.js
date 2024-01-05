import path from 'path';
import {QvdFileBuilder} from '../src';

test('Parsing a well-formed QVD file should return a QvdFile object', async () => {
  const file = await new QvdFileBuilder(path.join(__dirname, 'data/small.qvd')).load();

  expect(file).toBeDefined();
  expect(file.numberOfRows).toBe(606);
  expect(file.fieldNames.length).toBe(8);
  expect(file.path).toContain('small.qvd');
  expect(file.getRow(0)).toBeDefined();
  expect(file.getRow(605)).toBeDefined();
});

test('Parsing a QVD file with ~1000 rows should take less than 250ms', async () => {
  const start = Date.now();
  await new QvdFileBuilder(path.join(__dirname, 'data/small.qvd')).load();
  const end = Date.now();

  expect(end - start).toBeLessThan(250);
});

test('Parsing a QVD file with ~20000 rows should take less than 2500ms', async () => {
  const start = Date.now();
  await new QvdFileBuilder(path.join(__dirname, 'data/medium.qvd')).load();
  const end = Date.now();

  expect(end - start).toBeLessThan(2500);
});

test('Parsing a QVD file with ~60000 rows should take less than 5000ms', async () => {
  const start = Date.now();
  await new QvdFileBuilder(path.join(__dirname, 'data/large.qvd')).load();
  const end = Date.now();

  expect(end - start).toBeLessThan(5000);
});

test('Parsing a damaged QVD file should throw an error', async () => {
  const builder = new QvdFileBuilder(path.join(__dirname, 'data/damaged.qvd'));
  await expect(builder.load()).rejects.toThrow();
});
