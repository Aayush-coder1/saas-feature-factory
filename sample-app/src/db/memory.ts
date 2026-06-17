import { randomUUID } from 'node:crypto';

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
