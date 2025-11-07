import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Convert hex string to buffer
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a string using AES-256-GCM
 * @param text - The text to encrypt
 * @returns Object containing IV, encrypted data, and auth tag
 */
export function encrypt(text: string): {
  iv: string;
  encryptedData: string;
  authTag: string;
} {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypts an encrypted string using AES-256-GCM
 * @param encrypted - Object containing IV, encrypted data, and auth tag
 * @returns The decrypted string
 */
export function decrypt(encrypted: {
  iv: string;
  encryptedData: string;
  authTag: string;
}): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(encrypted.iv, 'hex');
  const encryptedText = encrypted.encryptedData;
  const authTag = Buffer.from(encrypted.authTag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypts an access token for storage
 * @param accessToken - The access token to encrypt
 * @returns Encrypted token as a JSON string
 */
export function encryptToken(accessToken: string): string {
  const encrypted = encrypt(accessToken);
  return JSON.stringify(encrypted);
}

/**
 * Decrypts an access token from storage
 * @param encryptedToken - The encrypted token as a JSON string
 * @returns The decrypted access token
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const encrypted = JSON.parse(encryptedToken);
    return decrypt(encrypted);
  } catch (error) {
    throw new Error('Failed to decrypt token: Invalid format');
  }
}

/**
 * Generates a random state string for OAuth CSRF protection
 * @returns A random hex string
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a string using SHA-256
 * @param text - The text to hash
 * @returns The hashed string in hex format
 */
export function hashString(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generates a secure random token
 * @param length - The length of the token in bytes (default: 32)
 * @returns A random hex string
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
