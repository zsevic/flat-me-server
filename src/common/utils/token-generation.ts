import { randomBytes } from 'crypto';
import { promisify } from 'util';

const randomBytesAsync = promisify(randomBytes);
const TOKEN_LENGTH = 24;

export async function generateToken() {
  return (await randomBytesAsync(TOKEN_LENGTH))
    .toString('base64')
    .replace(/\W/g, '');
}
