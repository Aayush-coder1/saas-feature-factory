import { randomBytes } from 'node:crypto';

interface OTPRecord {
  code: string;
  userId: string;
  expiresAt: number;
  verified: boolean;
}

const store: Map<string, OTPRecord> = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const CODE_LENGTH = 6;

export function generateOTP(userId: string): { code: string; expiresIn: number } {
  const code = randomBytes(3).readUIntBE(0, 3) % 900000 + 100000 + '';
  const expiresAt = Date.now() + OTP_TTL_MS;
  store.set(code, { code, userId, expiresAt, verified: false });
  setTimeout(() => store.delete(code), OTP_TTL_MS);
  return { code, expiresIn: OTP_TTL_MS / 1000 };
}

export function verifyOTP(userId: string, code: string): { valid: boolean; reason?: string } {
  const record = store.get(code);
  if (!record) return { valid: false, reason: 'Invalid or expired code' };
  if (record.userId !== userId) return { valid: false, reason: 'Code does not match user' };
  if (Date.now() > record.expiresAt) return { valid: false, reason: 'Code expired' };
  record.verified = true;
  store.delete(code);
  return { valid: true };
}
