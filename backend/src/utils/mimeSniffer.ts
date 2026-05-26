import * as path from 'path';

export interface SniffResult {
  mimeType: string;
  isAllowed: boolean;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/zip',
  'text/csv',
  'text/plain',
]);

/**
 * Sniffs the MIME type of a file buffer based on magic numbers (file headers)
 * and matches it with the extension to mitigate Remote Code Execution (RCE).
 */
export function sniffMimeType(buffer: Buffer, originalName: string): SniffResult {
  const ext = path.extname(originalName).toLowerCase();
  let mimeType = 'application/octet-stream';

  if (buffer.length >= 4 && buffer.toString('hex', 0, 4) === '25504446') {
    mimeType = 'application/pdf';
  } else if (buffer.length >= 8 && buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
    mimeType = 'image/png';
  } else if (buffer.length >= 3 && buffer.toString('hex', 0, 3) === 'ffd8ff') {
    mimeType = 'image/jpeg';
  } else if (buffer.length >= 6 && (buffer.toString('hex', 0, 6) === '474946383961' || buffer.toString('hex', 0, 6) === '474946383761')) {
    mimeType = 'image/gif';
  } else if (buffer.length >= 4 && buffer.toString('hex', 0, 4) === '504b0304') {
    // PK zip signature, could be zip, docx, or xlsx
    if (ext === '.docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (ext === '.xlsx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      mimeType = 'application/zip';
    }
  } else if (ext === '.csv' || ext === '.txt') {
    // Ensure no null bytes in the first 512 bytes to avoid binary executable masquerading
    const hasNullByte = buffer.slice(0, Math.min(buffer.length, 512)).includes(0);
    if (!hasNullByte) {
      mimeType = ext === '.csv' ? 'text/csv' : 'text/plain';
    }
  }

  const isAllowed = ALLOWED_MIME_TYPES.has(mimeType);

  return { mimeType, isAllowed };
}
