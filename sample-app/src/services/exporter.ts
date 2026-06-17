import { Request, Response } from 'express';
import { db } from '../db/memory.js';

export function exportTasksCSV(_req: Request, res: Response) {
  const tasks = db.tasks.getAll(1, 10000).data;
  const headers = ['id', 'title', 'description', 'status', 'priority', 'userId', 'labels', 'createdAt', 'updatedAt'];
  const rows = tasks.map(t => [
    t.id,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    t.userId,
    `"${(t.labels || []).join(';')}"`,
    t.createdAt,
    t.updatedAt,
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
  res.send(csv);
}
