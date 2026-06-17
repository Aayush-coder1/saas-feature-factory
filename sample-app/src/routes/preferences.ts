import { Router, Request, Response } from 'express';

interface UserPreferences {
  theme: 'light' | 'dark';
  userId: string;
}

const preferences: Map<string, UserPreferences> = new Map();

const router = Router();

router.get('/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  let prefs = preferences.get(userId);
  if (!prefs) {
    prefs = { theme: 'light', userId };
    preferences.set(userId, prefs);
  }
  res.json({ data: prefs });
});

router.put('/:userId/theme', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { theme } = req.body;
  if (!theme || !['light', 'dark'].includes(theme)) {
    res.status(400).json({ error: 'theme must be "light" or "dark"' });
    return;
  }
  let prefs = preferences.get(userId) || { userId, theme: 'light' };
  prefs.theme = theme;
  preferences.set(userId, prefs);
  res.json({ data: prefs, updated: true });
});

export { router as preferencesRouter };
