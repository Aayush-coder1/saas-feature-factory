import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/db/memory.js';

describe('Tasks API', () => {
  beforeEach(() => {
    db.tasks.reset();
  });

  it('GET /api/tasks returns all tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.total).toBeGreaterThanOrEqual(5);
  });

  it('POST /api/tasks creates a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task', userId: 'user-1', priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test task');
    expect(res.body.data.priority).toBe('high');
  });

  it('POST /api/tasks rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ description: 'no title or userId' });
    expect(res.status).toBe(400);
  });

  it('GET /api/tasks/:id returns a task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ title: 'Specific task', userId: 'user-1', priority: 'medium' });
    const taskId = createRes.body.data.id;

    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(taskId);
  });

  it('GET /api/tasks/:id returns 404 for missing', async () => {
    const res = await request(app).get('/api/tasks/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('PUT /api/tasks/:id updates a task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task to update', userId: 'user-1', priority: 'low' });
    const taskId = createRes.body.data.id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Updated title', status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated title');
    expect(res.body.data.status).toBe('done');
  });

  it('DELETE /api/tasks/:id deletes a task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task to delete', userId: 'user-1', priority: 'high' });
    const taskId = createRes.body.data.id;

    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(204);
  });

  it('GET /api/users/:userId/tasks returns user tasks', async () => {
    const res = await request(app).get('/api/users/user-1/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('GET /api/users/:userId/tasks/stats returns stats', async () => {
    const res = await request(app).get('/api/users/user-1/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('byPriority');
  });
});
