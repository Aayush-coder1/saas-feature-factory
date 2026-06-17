import { Router, Request, Response } from 'express';
import { db } from '../db/memory.js';

const router = Router();

router.get('/:userId/tasks', (req: Request, res: Response) => {
  const tasks = db.tasks.getByUser(req.params.userId);
  res.json({ data: tasks, total: tasks.length });
});

router.get('/:userId/tasks/stats', (req: Request, res: Response) => {
  const tasks = db.tasks.getByUser(req.params.userId);
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    byPriority: {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
    },
  };
  res.json({ data: stats });
});

export { router as usersRouter };
