import { DynamoDB } from 'aws-sdk';

const STYLE_PARTIAL_SCORING_TABLE =
  process.env.STYLE_PARTIAL_SCORING_TABLE || 'style-partial-scoring';

const dynamodbClient = new DynamoDB({
  region: process.env.REGION || 'us-east-2',
});

export const putStyleClusters = (
  rows: any[],
): Promise<DynamoDB.BatchWriteItemOutput> => {
  return dynamodbClient
    .batchWriteItem({
      RequestItems: {
        [STYLE_PARTIAL_SCORING_TABLE]: (rows || []).map(row => {
          return {
            PutRequest: {
              Item: row,
            },
          };
        }),
      },
    })
    .promise();
};

export const getStylePartialScoringConfig = async (
  finder: string,
): Promise<any> => {
  return dynamodbClient
    .getItem({
      TableName: STYLE_PARTIAL_SCORING_TABLE,
      Key: {
        pk: { S: 'stylePartialScoringConfig' },
        sk: { S: `${finder}::latest` },
      },
    })
    .promise()
    .then(item => {
      return (item || {}).Item || {};
    })
    .catch(() => ({}));
};

export const updateStylePartialScoringConfig = (
  finder: string,
  newConfig: any,
): Promise<any> => {
  return dynamodbClient
    .putItem({
      TableName: STYLE_PARTIAL_SCORING_TABLE,
      Item: Object.assign(newConfig, {
        pk: {
          S: 'stylePartialScoringConfig',
        },
        sk: {
          S: `${finder}::latest`,
        },
      }),
    })
    .promise();
};
