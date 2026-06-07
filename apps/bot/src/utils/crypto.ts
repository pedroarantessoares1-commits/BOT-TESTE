import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const IP_SALT = config.IP_HASH_SALT;
const JWT_SECRET = config.JWT_SECRET;

export function hashIp(ip: string): string {
  return crypto.createHmac('sha256', IP_SALT).update(ip).digest('hex');
}

export function generateVerificationToken(guildId: string, userId: string): string {
  return jwt.sign({ guildId, userId }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { guildId: string; userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { guildId: string; userId: string };
    return decoded;
  } catch (err) {
    return null;
  }
}
