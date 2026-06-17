import { Router, Request, Response } from 'express';
import { generateOTP, verifyOTP } from '../services/otp.js';

const router = Router();

router.post('/request-otp', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  const result = generateOTP(userId);
  res.json({
    message: 'OTP sent',
    expires_in: result.expiresIn,
    code: result.code,
  });
});

router.post('/verify-otp', (req: Request, res: Response) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    res.status(400).json({ error: 'userId and otp are required' });
    return;
  }
  const result = verifyOTP(userId, otp);
  if (!result.valid) {
    res.status(401).json({ error: result.reason });
    return;
  }
  res.json({
    token: `sess_${userId}_${Date.now()}`,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  });
});

export { router as authRouter };
