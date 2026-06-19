import express, { Request, Response } from 'express';
import { db } from '../db/memory';
import { v4 as uuidv4 } from 'uuid';
import { setTimeout } from 'timers';

const router = express.Router({ mergeParams: true });

router.post('/request-otp', async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  const otpCode = uuidv4().substr(0, 6);
  db.tasks.reset();
  db['otp'] = {
    codes: {},
  };
  db['otp'].codes[userId] = {
    code: otpCode,
    expiresAt: new Date().getTime() + 300000,
  };
  return res.json({ code: otpCode });
});

router.post('/verify-otp', async (req: Request, res: Response) => {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'User ID and code are required' });
  }
  if (!db['otp']) {
    db['otp'] = {
      codes: {},
    };
  }
  if (!db['otp'].codes[userId] || db['otp'].codes[userId].code !== code || db['otp'].codes[userId].expiresAt < new Date().getTime()) {
    return res.status(401).json({ error: 'Invalid or expired OTP code' });
  }
  const sessionToken = uuidv4();
  const users = db.tasks.getAll().filter((task) => task.userId === userId);
  if (users.length > 0) {
    users[0].sessionToken = sessionToken;
  }
  return res.json({ sessionToken });
});

export { router as authRouter };
