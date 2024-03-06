import fs from 'fs';
import {QvdDataFrame} from '../src';

test('Write QVD file successfully to disk', async () => {
  const rawDf = {
    columns: ['Key', 'Value'],
    data: [
      [1, 'A'],
      [2, 'B'],
      [3, 'C'],
      [4, 'D'],
      [5, 'E'],
    ],
  };

  const df = await QvdDataFrame.fromDict(rawDf);

  expect(df).toBeDefined();
  expect(df.shape).toBeDefined();
  expect(df.shape[0]).toBe(5);
  expect(df.shape[1]).toBe(2);
  expect(df.columns).toBeDefined();
  expect(df.columns.length).toBe(2);
  expect(df.data).toBeDefined();
  expect(df.data.length).toBe(5);
  expect(df.head(2).shape).toEqual([2, 2]);

  await df.toQvd('__tests__/data/written.qvd');

  expect(fs.existsSync('__tests__/data/written.qvd')).toBe(true);
  expect(fs.statSync('__tests__/data/written.qvd').size).toBeGreaterThan(0);

  fs.unlinkSync('__tests__/data/written.qvd');
});
