/* eslint-disable @typescript-eslint/no-unused-vars */
import { Iterator } from 'mingo/lazy';
import { Options } from 'mingo/core';

export const $outGroup = (
  collection: Iterator,
  _expr: any,
  _options?: Options,
): Iterator => {
  return collection.map((item: any) => {
    const valueGroup = item['_id'];

    return Object.keys(item)
      .reduce((acc, rawProp) => {
        if (rawProp === '_id') {
          return acc;
        }

        const index = +rawProp.replace(/^op_/, '');

        if (!isNaN(index)) {
          acc.push(index);
        }

        return acc;
      }, [] as number[])
      .sort()
      .reduce((acc, index) => {
        const rowValue = item[`op_${index}`];

        acc.splice(index, 1, rowValue);

        return acc;
      }, valueGroup);
  });
};
