import path from 'path';
import {QvdDataFrame} from '../src';

test('Parsing a QVD file with ~1000 rows should take less than 250ms', async () => {
  const start = Date.now();
  const df = await QvdDataFrame.fromQvd(path.join(__dirname, 'data/small.qvd'));
  const end = Date.now();

  expect(end - start).toBeLessThan(250);
  expect(df).toBeDefined();
  expect(df.shape).toBeDefined();
  expect(df.shape[0]).toBe(606);
  expect(df.shape[1]).toBe(8);
  expect(df.columns).toBeDefined();
  expect(df.columns.length).toBe(8);
  expect(df.data).toBeDefined();
  expect(df.data.length).toBe(606);
  expect(df.head(5).shape).toEqual([5, 8]);
});

test('Parsing a QVD file with ~20000 rows should take less than 2500ms', async () => {
  const start = Date.now();
  const df = await QvdDataFrame.fromQvd(path.join(__dirname, 'data/medium.qvd'));
  const end = Date.now();

  expect(end - start).toBeLessThan(2500);
  expect(df).toBeDefined();
  expect(df.shape).toBeDefined();
  expect(df.shape[0]).toBe(18484);
  expect(df.shape[1]).toBe(13);
  expect(df.columns).toBeDefined();
  expect(df.columns.length).toBe(13);
  expect(df.data).toBeDefined();
  expect(df.data.length).toBe(18484);
  expect(df.head(5).shape).toEqual([5, 13]);
});

test('Parsing a QVD file with ~60000 rows should take less than 5000ms', async () => {
  const start = Date.now();
  const df = await QvdDataFrame.fromQvd(path.join(__dirname, 'data/large.qvd'));
  const end = Date.now();

  expect(end - start).toBeLessThan(5000);
  expect(df).toBeDefined();
  expect(df.shape).toBeDefined();
  expect(df.shape[0]).toBe(60398);
  expect(df.shape[1]).toBe(11);
  expect(df.columns).toBeDefined();
  expect(df.columns.length).toBe(11);
  expect(df.data).toBeDefined();
  expect(df.data.length).toBe(60398);
  expect(df.head(5).shape).toEqual([5, 11]);
});

test('Parsing a damaged QVD file should throw an error', async () => {
  await expect(QvdDataFrame.fromQvd(path.join(__dirname, 'data/damaged.qvd'))).rejects.toThrow();
});
