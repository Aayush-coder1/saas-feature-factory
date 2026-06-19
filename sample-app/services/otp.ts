import { db } from '../db/memory';
import { v4 as uuidv4 } from 'uuid';

export function generateOtpCode(userId: string): string {
  if (!db['otp']) {
    db['otp'] = {
      codes: {},
    };
  }
  const otpCode = uuidv4().substr(0, 6);
  db['otp'].codes[userId] = {
    code: otpCode,
    expiresAt: new Date().getTime() + 300000,
  };
  return otpCode;
}

export function verifyOtpCode(userId: string, code: string): boolean {
  if (!db['otp']) {
    return false;
  }
  if (!db['otp'].codes[userId] || db['otp'].codes[userId].code !== code || db['otp'].codes[userId].expiresAt < new Date().getTime()) {
    return false;
  }
  return true;
}
