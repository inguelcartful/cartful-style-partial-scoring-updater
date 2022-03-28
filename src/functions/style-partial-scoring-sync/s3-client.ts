import { S3 } from 'aws-sdk';

export const s3Client = new S3({
  region: process.env.REGION || 'us-east-2',
});

export const listObjects = (
  bucket: string,
  prefix: string,
): Promise<S3.ListObjectsV2Output> => {
  return s3Client.listObjectsV2({ Bucket: bucket, Prefix: prefix }).promise();
};

export const getObject = (
  bucket: string,
  key: string,
): Promise<S3.GetObjectOutput> => {
  return s3Client.getObject({ Bucket: bucket, Key: key }).promise();
};
