import express from 'express';
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
