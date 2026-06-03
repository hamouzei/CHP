import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const KEYS_DIR = path.join(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'jwt.key');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'jwt.key.pub');

export function getKeys() {
  let privateKey: string;
  let publicKey: string;

  // Priority 1: Load from environment variables (required for Vercel/production)
  if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
    return {
      privateKey: process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      publicKey: process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'),
    };
  }

  // Priority 2: Load from key files on disk (works in dev and on Vercel if keys/ is in repo)
  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    return { privateKey, publicKey };
  }

  // Priority 3: On Vercel (read-only filesystem), cannot generate — fail fast
  if (process.env.VERCEL) {
    throw new Error(
      'JWT key files not found and JWT_PRIVATE_KEY/JWT_PUBLIC_KEY env vars not set. ' +
      'Set these environment variables in Vercel project settings.'
    );
  }

  // Priority 4: Dev fallback — generate keys and save to disk
  console.log('🔑 Generating RS256 public/private key-pair for development...');
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  const keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  privateKey = keyPair.privateKey;
  publicKey = keyPair.publicKey;

  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, 'utf8');
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, 'utf8');
  console.log('🔑 RS256 keys generated successfully.');

  return { privateKey, publicKey };
}
