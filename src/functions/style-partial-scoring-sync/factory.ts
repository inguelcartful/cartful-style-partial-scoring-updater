import { S3, DynamoDB } from 'aws-sdk';
import { parse } from '@fast-csv/parse';
import * as PromiseBb from 'bluebird';
import { listObjects, getObject } from './s3-client';
import {
  putStylePartialScoring,
  getStylePartialScoringVersion,
  updateStylePartialScoringVersion,
} from './dynamodb-client';
import { GZip } from './gzip';

const insertDataIntoDB = async (
  version: string | number,
  rows: any[],
  experience?: string,
): Promise<DynamoDB.BatchWriteItemOutput> => {
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

  return putStylePartialScoring(partialScoring);
};

const getFilesToSync = (
  bucket: string,
  prefix: string,
  objects: S3.ListObjectsV2Output,
): Promise<S3.GetObjectOutput>[] => {
  const validObjects = (objects.Contents || []).filter(obj =>
    ('' + obj.Key).startsWith(`${prefix}/features-`),
  );

  return validObjects.map(obj => getObject(bucket, obj.Key!));
};

const stylePartialScoringDispatcher = async (
  event: any,
  context: any,
): Promise<any> => {
  process.removeAllListeners('unhandledRejection');
  context.callbackWaitsForEmptyEventLoop = false;

  const { bucket, prefix, finder } = event;
  let version = await getStylePartialScoringVersion(finder);
  version = +version + 1;

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
        batchWriteList.push(
          insertDataIntoDB(version, batchWriteQueueList.concat([]), finder),
        );
        batchWriteQueueList = [];
      }
    };

    const completeOperation = (rowCount: number, error?: any) => {
      if (error || rowCount < 0) {
        console.error('Error on read-csv operation.');
        console.error(error);
      }

      if (batchWriteQueueList.length > 0) {
        batchWriteList.push(
          insertDataIntoDB(version, batchWriteQueueList.concat([]), finder),
        );
        batchWriteQueueList = [];
      }

      PromiseBb.each(batchWriteList, () => ({})).then(resolve);
    };

    const stream = parse({ headers: true })
      .on('data', (row: any) => addOperationToQueue(row))
      .on('error', error => completeOperation(-1, error))
      .on('end', (rowCount: number) => completeOperation(rowCount));

    stream.write(file.Body);
    stream.end();

    return promise;
  });

  await PromiseBb.each(p, () => ({}));

  return updateStylePartialScoringVersion(finder, version);
};

export const stylePartialScoringDispatcherFn = stylePartialScoringDispatcher;
