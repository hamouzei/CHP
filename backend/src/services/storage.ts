import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize S3 client only if provider is s3
let s3Client: S3Client | null = null;
if (STORAGE_PROVIDER === 's3') {
  s3Client = new S3Client({
    region: AWS_REGION,
  });
}

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  pathPrefix: string
): Promise<{ storageKey: string; storageUrl: string }> {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const fileExt = path.extname(fileName);
  const sanitizedFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `${pathPrefix}/${uniqueSuffix}_${sanitizedFileName}`;

  if (STORAGE_PROVIDER === 's3' && s3Client) {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: storageKey,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    await s3Client.send(command);
    
    // Return relative API download link that internally handles pre-signed redirect
    const storageUrl = `/api/v1/assessments/evidence/${storageKey}/download`;
    return { storageKey, storageUrl };
  } else {
    // Local storage provider
    const fullDir = path.join(UPLOAD_DIR, pathPrefix);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
    const localFileName = `${uniqueSuffix}_${sanitizedFileName}`;
    const filePath = path.join(fullDir, localFileName);
    fs.writeFileSync(filePath, fileBuffer);
    
    const localStorageKey = `${pathPrefix}/${localFileName}`;
    const storageUrl = `/api/v1/assessments/evidence/${localFileName}/download`;
    return { storageKey: localStorageKey, storageUrl };
  }
}

export async function deleteFile(storageKey: string): Promise<void> {
  if (STORAGE_PROVIDER === 's3' && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: storageKey,
    });
    await s3Client.send(command);
  } else {
    // Local storage delete
    const filePath = path.join(UPLOAD_DIR, storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

export async function getDownloadUrl(storageKey: string, originalFileName: string): Promise<string> {
  if (STORAGE_PROVIDER === 's3' && s3Client) {
    // Generate pre-signed URL with 1-hour expiry (3600 seconds)
    const getCommand = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: storageKey,
      ResponseContentDisposition: `attachment; filename="${originalFileName}"`,
    });
    return getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
  } else {
    // For local files, return the API path that streams it
    return `/api/v1/assessments/evidence/${path.basename(storageKey)}/download`;
  }
}
