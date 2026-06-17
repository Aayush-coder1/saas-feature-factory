import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { tasksRouter } from './routes/tasks.js';
import { usersRouter } from './routes/users.js';
import { authRouter } from './routes/auth.js';
import { preferencesRouter } from './routes/preferences.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/tasks', tasksRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/preferences', preferencesRouter);

export { app };
