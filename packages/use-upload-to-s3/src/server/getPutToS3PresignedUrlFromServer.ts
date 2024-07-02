'use server';

import {
  DeleteBucketCorsCommand,
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
  type CORSRule,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
const region = process.env.AWS_REGION!;

const s3Client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});

const generateUniqueFileName = (originalName: string): string => {
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
  const extension = originalName.split('.').pop();
  return `${nanoid()}-${nameWithoutExtension}.${extension}`;
};

let key: string | undefined = undefined;
let tmpCORSRule: CORSRule | undefined = undefined;

async function getCurrentCORSRules(bucketName: string): Promise<CORSRule[]> {
  const getCurrentCORSConfigurationCommand = new GetBucketCorsCommand({
    Bucket: bucketName,
  });
  let currentCORSRules: CORSRule[] = [];
  try {
    const response = await s3Client.send(getCurrentCORSConfigurationCommand);
    currentCORSRules = response.CORSRules ?? [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    /* empty */
  }
  return currentCORSRules;
}

export async function getPutToS3PresignedUrlFromServer(
  file: File,
  bucketName: string,
  origin: string
) {
  if (file.type === 'image/svg+xml') {
    throw new Error(
      'SVG files are not allowed for security reasons. See https://www.fortinet.com/blog/threat-research/scalable-vector-graphics-attack-surface-anatomy'
    );
  }

  const currentCORSRules = await getCurrentCORSRules(bucketName);

  const qualifiedOrigin = origin.split(':').shift()?.includes('localhost')
    ? 'http://' + origin
    : 'https://' + origin;
  tmpCORSRule = {
    AllowedHeaders: ['*'],
    AllowedMethods: ['PUT'],
    AllowedOrigins: [qualifiedOrigin],
    ExposeHeaders: [],
    MaxAgeSeconds: 3000,
  };

  const putTmpCorsCommand = new PutBucketCorsCommand({
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [...currentCORSRules, tmpCORSRule],
    },
  });
  await s3Client.send(putTmpCorsCommand);

  // Generate a randomised/uuid key
  key = generateUniqueFileName(file.name);

  const unknownFileType =
    file.type === 'application/octet-stream' || file.type === '';

  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentLength: file.size,
  });
  if (!unknownFileType) {
    putCommand.input.ContentType = file.type;
  }
  // Provide a cleanup function to remove the tmp CORS rule if the upload doesn't complete
  setTimeout(() => {
    removeTmpCors(bucketName);
  }, 10000);

  const signableHeaders = new Set(['content-length']);
  if (!unknownFileType) {
    signableHeaders.add('content-type');
  }
  return await getSignedUrl(s3Client, putCommand, {
    signableHeaders,
    expiresIn: 10,
  });
}

export async function getKey() {
  return key;
}

export async function removeTmpCors(bucketName: string) {
  if (tmpCORSRule !== undefined) {
    const currentCORSRules = await getCurrentCORSRules(bucketName);
    currentCORSRules.splice(currentCORSRules.indexOf(tmpCORSRule), 1);

    if (currentCORSRules.length === 0) {
      const command = new DeleteBucketCorsCommand({
        Bucket: bucketName,
      });
      await s3Client.send(command);
    } else {
      const command = new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: currentCORSRules,
        },
      });
      await s3Client.send(command);
    }
    tmpCORSRule = undefined;
  }
}
