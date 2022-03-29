import { S3 } from 'aws-sdk';
import { parse } from '@fast-csv/parse';
import { listObjects, getObject } from './s3-client';
import {
  putStylePartialScoring,
  getStylePartialScoringConfig,
  updateStylePartialScoringConfig,
} from './dynamodb-client';
import { GZip } from './gzip';

const insertDataIntoDB = async (
  version: string | number,
  rows: any[],
  experience: string,
  counter: number,
): Promise<any> => {
  const partialScoring: any[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];

    let scores = await GZip.tryUnCompressJSON(row['scores']);
    scores =
      scores && scores.length
        ? scores.reduce((obj: any, value: any) => {
            obj[value['sku']] = value['scores'];

            return obj;
          }, {})
        : {};
    scores = await GZip.tryCompressJSON(scores);

    row['scores'] = scores;

    partialScoring.push({
      pk: `${experience || row['finder']}::custom-partial-scoring`,
      sk: `${row['style_id']}::${version}`,
      scores: row['scores'],
    });
  }

  console.log('Processing batch #no ' + counter);

  return new Promise(r => {
    setTimeout(r, 500 * (counter - 1));
  }).then(() => putStylePartialScoring(partialScoring));
};

const getFilesToSync = (
  bucket: string,
  prefix: string,
  objects: S3.ListObjectsV2Output,
): Promise<S3.GetObjectOutput>[] => {
  // const validObjects = (objects.Contents || []).filter(obj =>
  //   ('' + obj.Key).startsWith(`${prefix}/features-`),
  // );
  const validObjects = objects.Contents || [];

  return validObjects.map(obj => getObject(bucket, obj.Key!));
};

const stylePartialScoringDispatcher = async (
  event: any,
  context: any,
): Promise<any> => {
  process.removeAllListeners('unhandledRejection');
  context.callbackWaitsForEmptyEventLoop = false;
  let counter = 0;

  const { bucket, prefix, finder } = event;
  const config = await getStylePartialScoringConfig(finder);
  let version = event.version || +config.version + 1;

  if (isNaN(version)) {
    version = 1;
  }

  const filesToSync = getFilesToSync(
    bucket,
    prefix,
    await listObjects(bucket, prefix),
  );

  const p = filesToSync.map(async asyncFile => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let resolve = (v: any) => {};
    let batchWriteQueueList: any[] = [];
    const file = await asyncFile;
    const promise = new Promise(r => (resolve = r));
    const batchWriteList: Promise<any>[] = [];

    const addOperationToQueue = (row: any) => {
      batchWriteQueueList.push(row);

      if (batchWriteQueueList.length === 25) {
        counter++;
        console.log('Batch ' + counter);

        batchWriteList.push(
          insertDataIntoDB(
            version,
            batchWriteQueueList.concat([]),
            finder,
            counter,
          ),
        );
        batchWriteQueueList = [];
      }
    };

    const completeOperation = async (rowCount: number, error?: any) => {
      if (error || rowCount < 0) {
        console.error('Error on read-csv operation.');
        console.error(error);
      }

      if (batchWriteQueueList.length > 0) {
        counter++;
        console.log('Batch ' + counter);

        batchWriteList.push(
          insertDataIntoDB(
            version,
            batchWriteQueueList.concat([]),
            finder,
            counter,
          ),
        );
        batchWriteQueueList = [];
      }

      for (let index = 0; index < batchWriteList.length; index++) {
        await batchWriteList[index];
      }

      resolve(null);
    };

    const stream = parse({ headers: true })
      .on('data', (row: any) => addOperationToQueue(row))
      .on('error', error => completeOperation(-1, error))
      .on('end', (rowCount: number) => completeOperation(rowCount).then());

    stream.write(file.Body);
    stream.end();

    return promise;
  });

  for (let index = 0; index < p.length; index++) {
    await p[index];
  }

  return updateStylePartialScoringConfig(finder, {
    version: { N: '' + version },
    weightPercent: {
      N:
        '' +
        ((config.weightPercent && config.weightPercent.N
          ? config.weightPercent.N
          : config.weightPercent) || 1),
    },
    maxScore: {
      N:
        '' +
        ((config.maxScore && config.maxScore.N
          ? config.maxScore.N
          : config.maxScore) || 9),
    },
  });
};

export const stylePartialScoringDispatcherFn = stylePartialScoringDispatcher;
