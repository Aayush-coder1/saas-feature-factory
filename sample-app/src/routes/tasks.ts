import { Router, Request, Response } from 'express';
import { exportTasksCSV } from '../services/exporter.js';
import { exportTasksCSV } from '../services/exporter.js';
import { db } from '../db/memory.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { label } = req.query;

  if (label) {
    const results = db.tasks.getByLabel(label as string);
    res.json({ data: results, total: results.length, label });
    return;
  }

  const tasks = db.tasks.getAll();
  res.json({ data: tasks, total: tasks.length });
});

router.get('/:id', (req: Request, res: Response) => {
  const task = db.tasks.getById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ data: task });
});

router.post('/', (req: Request, res: Response) => {
  const { title, description, status, priority, userId, labels } = req.body;
  if (!title || !userId) {
    res.status(400).json({ error: 'title and userId are required' });
    return;
  }
  const task = db.tasks.create({
    title, description: description || '', status: status || 'todo',
    priority: priority || 'medium', userId, labels: labels || [],
  });
  res.status(201).json({ data: task });
});

router.put('/:id', (req: Request, res: Response) => {
  const task = db.tasks.update(req.params.id, req.body);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ data: task });
});

router.get('/export/csv', exportTasksCSV);

router.get('/export/csv', exportTasksCSV);

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = db.tasks.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.status(204).send();
});

export { router as tasksRouter };
