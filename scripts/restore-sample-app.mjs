#!/usr/bin/env node
/**
 * Restores the sample-app to its original clean state.
 * Run this before `npm run demo` to ensure a fresh start.
 */
import { writeFileSync, unlinkSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const APP = resolve(ROOT, 'sample-app');

const files = {
  'src/db/memory.ts': `import { randomUUID } from 'node:crypto';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  userId: string;
  createdAt: string;
  updatedAt: string;
  labels?: string[];
}

const tasks: Map<string, Task> = new Map();

function seed() {
  const now = new Date().toISOString();
  const sampleTasks: Task[] = [
    { id: randomUUID(), title: 'Set up CI pipeline', description: 'Configure GitHub Actions for automated testing', status: 'done', priority: 'high', userId: 'user-1', createdAt: now, updatedAt: now, labels: ['devops'] },
    { id: randomUUID(), title: 'Design landing page', description: 'Create wireframes for the marketing site', status: 'in_progress', priority: 'medium', userId: 'user-1', createdAt: now, updatedAt: now, labels: ['frontend'] },
    { id: randomUUID(), title: 'Write API documentation', description: 'Document all REST endpoints with examples', status: 'todo', priority: 'low', userId: 'user-2', createdAt: now, updatedAt: now, labels: ['docs'] },
    { id: randomUUID(), title: 'Implement rate limiting', description: 'Add rate limiting middleware to prevent abuse', status: 'todo', priority: 'high', userId: 'user-2', createdAt: now, updatedAt: now, labels: ['backend'] },
    { id: randomUUID(), title: 'Add search functionality', description: 'Full-text search across tasks', status: 'todo', priority: 'medium', userId: 'user-1', createdAt: now, updatedAt: now, labels: ['feature'] },
  ];
  for (const task of sampleTasks) {
    tasks.set(task.id, task);
  }
}

seed();

export const db = {
  tasks: {
    getAll: (): Task[] => Array.from(tasks.values()),
    getById: (id: string): Task | undefined => tasks.get(id),
    create: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
      const now = new Date().toISOString();
      const task: Task = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
      tasks.set(task.id, task);
      return task;
    },
    update: (id: string, data: Partial<Task>): Task | undefined => {
      const existing = tasks.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...data, id: existing.id, updatedAt: new Date().toISOString() };
      tasks.set(id, updated);
      return updated;
    },
    delete: (id: string): boolean => tasks.delete(id),
    reset: (): void => {
      tasks.clear();
      seed();
    },
    getByUser: (userId: string): Task[] => Array.from(tasks.values()).filter(t => t.userId === userId),
  },
};
`,

  'src/app.ts': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { tasksRouter } from './routes/tasks.js';
import { usersRouter } from './routes/users.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);

export { app };
`,

  'src/routes/tasks.ts': `import { Router, Request, Response } from 'express';
import { db } from '../db/memory.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
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

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = db.tasks.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.status(204).send();
});

export { router as tasksRouter };
`,
};

// Write core files
for (const [rel, content] of Object.entries(files)) {
  writeFileSync(resolve(APP, rel), content);
}

// Delete generated files
const generated = [
  'src/services/exporter.ts', 'src/services/otp.ts',
  'src/routes/auth.ts', 'src/routes/preferences.ts',
  'src/middleware/rateLimiter.ts', 'docs',
];

for (const f of generated) {
  const p = resolve(APP, f);
  if (existsSync(p)) {
    try { rmSync(p, { recursive: true }); } catch { unlinkSync(p); }
  }
}

// Clean vite cache
try { rmSync(resolve(APP, 'node_modules/.vite'), { recursive: true }); } catch {}

console.log('Sample-app restored to clean state.');
