import { Stream } from 'stream';

export const streamToPromise = (
  stream: Stream,
  customEndEvent = 'end',
  customFailEvent = 'error',
): [Promise<void>, Function, Function] => {
  let done: Function;
  let fail: Function;
  const promise = new Promise<void>((d, f) => {
    done = d;
    fail = f;
  });

  stream
    .on(customFailEvent, () => fail())
    .on(customEndEvent, () => {
      try {
        done();
      } catch (error) {
        console.error(
          'There is an error when trying to resolve promise related to stream',
          error,
        );
      }
    });

  return [promise, (r: any): void => done(r), (r: any): void => fail(r)];
};
