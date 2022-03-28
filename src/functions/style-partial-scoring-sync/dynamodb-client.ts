import { DynamoDB } from 'aws-sdk';

const STYLE_PARTIAL_SCORING_TABLE =
  process.env.STYLE_PARTIAL_SCORING_TABLE || 'style-partial-scoring';

const dynamodbClient = new DynamoDB({
  region: process.env.REGION || 'us-east-2',
});

export const putStylePartialScoring = (
  rows: any[],
): Promise<DynamoDB.BatchWriteItemOutput> => {
  return dynamodbClient
    .batchWriteItem({
      RequestItems: {
        [STYLE_PARTIAL_SCORING_TABLE]: (rows || []).map(row => {
          return {
            PutRequest: {
              Item: {
                pk: { S: row['pk'] },
                sk: { S: row['sk'] },
                scores: { S: row['scores'] },
              },
            },
          };
        }),
      },
    })
    .promise();
};

export const getStylePartialScoringVersion = async (
  finder: string,
): Promise<string | number> => {
  return dynamodbClient
    .getItem({
      TableName: STYLE_PARTIAL_SCORING_TABLE,
      Key: {
        pk: { S: `${finder}::custom-partial-scoring` },
        sk: { S: 'version' },
      },
    })
    .promise()
    .then(item => {
      return (((item || {}).Item || {}).version as number) || 0;
    })
    .catch(() => 0);
};

export const updateStylePartialScoringVersion = (
  finder: string,
  version: number,
): Promise<any> => {
  return dynamodbClient
    .putItem({
      TableName: STYLE_PARTIAL_SCORING_TABLE,
      Item: {
        pk: {
          S: `${finder}::custom-partial-scoring`,
        },
        sk: {
          S: 'version',
        },
        version: {
          N: '' + version,
        },
      },
    })
    .promise();
};
