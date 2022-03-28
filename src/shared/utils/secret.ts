import { SecretsManager } from 'aws-sdk';

const secretsManagerClient = new SecretsManager({
  region: process.env.REGION || 'us-east-1',
});

export const getSecret = async <T>(secretId: string): Promise<T> => {
  const rawSecret = await secretsManagerClient
    .getSecretValue({
      SecretId: secretId,
    })
    .promise();

  if (!rawSecret || !rawSecret.SecretString) {
    throw new Error('There is not a valid SecretString');
  }

  let secret: any = null;

  try {
    secret = JSON.parse(rawSecret.SecretString);
  } catch (e) {
    throw new Error('Credentials cannot be cast to JSON');
  }

  return secret;
};
