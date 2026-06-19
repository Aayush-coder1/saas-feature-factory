"""
Code Generation Agent - Picks up blueprints from the Band room,
generates actual code files, writes them to the workspace,
and posts the resulting patch to the room.
"""

from ..core.base_agent import BaseAgent
from ..core.message_bus import Message
from ..core.config import config
from .code_writer import CodeWriter
from ..llm_service import generate_code
from ..common.state_reporter import report_state


class CodeGenAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(name="code-gen-agent", **kwargs)
        self.writer = CodeWriter()

    def _generate_pagination_support(self):
        """Generate pagination for GET /api/tasks."""
        self.writer.modify_file(
            "src/db/memory.ts",
            "    getAll: (): Task[] => Array.from(tasks.values()),",
            """    getAll: (page: number = 1, limit: number = 20): { data: Task[]; total: number; page: number; limit: number; totalPages: number } => {
      const all = Array.from(tasks.values());
      const total = all.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      const data = all.slice(start, start + limit);
      return { data, total, page, limit, totalPages };
    },
    search: (query: string): Task[] => {
      const q = query.toLowerCase();
      return Array.from(tasks.values()).filter(
        t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    },
    getByLabel: (label: string): Task[] => {
      return Array.from(tasks.values()).filter(t => t.labels?.includes(label));
    },""",
        )
        self.writer.modify_file(
            "src/routes/tasks.ts",
            "const tasks = db.tasks.getAll();",
            "const page = parseInt(req.query.page as string) || 1;\n  const limit = parseInt(req.query.limit as string) || 20;\n  const result = db.tasks.getAll(page, limit);",
        )
        self.writer.modify_file(
            "src/routes/tasks.ts",
            "res.json({ data: tasks, total: tasks.length });",
            "res.json(result);",
        )

    def _generate_export_csv(self):
        """Generate CSV export for tasks."""
        exporter_code = """import { Request, Response } from 'express';
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
  const csv = [headers.join(','), ...rows].join('\\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
  res.send(csv);
}
"""
        self.writer.write_file("src/services/exporter.ts", exporter_code)
        self.writer.modify_file(
            "src/routes/tasks.ts",
            """import { Router, Request, Response } from 'express';""",
            """import { Router, Request, Response } from 'express';
import { exportTasksCSV } from '../services/exporter.js';""",
        )
        self.writer.modify_file(
            "src/routes/tasks.ts",
            """router.delete('/:id',""",
            """router.get('/export/csv', exportTasksCSV);

router.delete('/:id',""",
        )

    def _generate_rate_limiter(self):
        """Generate rate limiting middleware."""
        rate_limiter_code = """import { Request, Response, NextFunction } from 'express';

const windows: Map<string, { count: number; resetAt: number }> = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = (req as any).userId || req.ip || 'anonymous';
  const now = Date.now();
  let record = windows.get(key);

  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    windows.set(key, record);
  }

  record.count++;
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - record.count));
  res.setHeader('X-RateLimit-Reset', record.resetAt.toString());

  if (record.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests. Try again later.' });
    return;
  }

  next();
}
"""
        self.writer.write_file("src/middleware/rateLimiter.ts", rate_limiter_code)

    def _generate_otp_auth(self):
        """Generate OTP authentication system."""
        otp_service = """import { randomBytes } from 'node:crypto';

interface OTPRecord {
  code: string;
  userId: string;
  expiresAt: number;
  verified: boolean;
}

const store: Map<string, OTPRecord> = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const CODE_LENGTH = 6;

export function generateOTP(userId: string): { code: string; expiresIn: number } {
  const code = randomBytes(3).readUIntBE(0, 3) % 900000 + 100000 + '';
  const expiresAt = Date.now() + OTP_TTL_MS;
  store.set(code, { code, userId, expiresAt, verified: false });
  setTimeout(() => store.delete(code), OTP_TTL_MS);
  return { code, expiresIn: OTP_TTL_MS / 1000 };
}

export function verifyOTP(userId: string, code: string): { valid: boolean; reason?: string } {
  const record = store.get(code);
  if (!record) return { valid: false, reason: 'Invalid or expired code' };
  if (record.userId !== userId) return { valid: false, reason: 'Code does not match user' };
  if (Date.now() > record.expiresAt) return { valid: false, reason: 'Code expired' };
  record.verified = true;
  store.delete(code);
  return { valid: true };
}
"""
        auth_routes = """import { Router, Request, Response } from 'express';
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
"""
        self.writer.write_file("src/services/otp.ts", otp_service)
        self.writer.write_file("src/routes/auth.ts", auth_routes)
        self.writer.modify_file(
            "src/app.ts",
            """import { usersRouter } from './routes/users.js';""",
            """import { usersRouter } from './routes/users.js';
import { authRouter } from './routes/auth.js';""",
        )
        self.writer.modify_file(
            "src/app.ts",
            """app.use('/api/users', usersRouter);""",
            """app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);""",
        )

    def _generate_label_filtering(self):
        """Generate label/category filtering for tasks."""
        self.writer.modify_file(
            "src/db/memory.ts",
            "    getAll: (): Task[] => Array.from(tasks.values()),",
            """    getAll: (): Task[] => Array.from(tasks.values()),
    getByLabel: (label: string): Task[] => {
      return Array.from(tasks.values()).filter(t => t.labels?.includes(label));
    },""",
        )
        self.writer.modify_file(
            "src/routes/tasks.ts",
            """router.get('/', (_req: Request, res: Response) => {
  const tasks = db.tasks.getAll();
  res.json({ data: tasks, total: tasks.length });
});""",
            """router.get('/', (req: Request, res: Response) => {
  const { label } = req.query;

  if (label) {
    const results = db.tasks.getByLabel(label as string);
    res.json({ data: results, total: results.length, label });
    return;
  }

  const tasks = db.tasks.getAll();
  res.json({ data: tasks, total: tasks.length });
});""",
        )

    def _generate_search(self):
        """Generate full-text search for tasks."""
        self.writer.modify_file(
            "src/db/memory.ts",
            "    getAll: (): Task[] => Array.from(tasks.values()),",
            """    getAll: (): Task[] => Array.from(tasks.values()),
    search: (query: string): Task[] => {
      const q = query.toLowerCase();
      return Array.from(tasks.values()).filter(
        t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    },""",
        )
        self.writer.modify_file(
            "src/routes/tasks.ts",
            """router.get('/', (_req: Request, res: Response) => {
  const tasks = db.tasks.getAll();
  res.json({ data: tasks, total: tasks.length });
});""",
            """router.get('/', (req: Request, res: Response) => {
  const { q } = req.query;

  if (q) {
    const results = db.tasks.search(q as string);
    res.json({ data: results, total: results.length, query: q });
    return;
  }

  const tasks = db.tasks.getAll();
  res.json({ data: tasks, total: tasks.length });
});""",
        )

    def _generate_preferences(self):
        """Generate theme/preferences system."""
        preferences_code = """import { Router, Request, Response } from 'express';

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
"""
        self.writer.write_file("src/routes/preferences.ts", preferences_code)
        self.writer.modify_file(
            "src/app.ts",
            """import { usersRouter } from './routes/users.js';""",
            """import { usersRouter } from './routes/users.js';
import { preferencesRouter } from './routes/preferences.js';""",
        )
        self.writer.modify_file(
            "src/app.ts",
            """app.use('/api/users', usersRouter);""",
            """app.use('/api/users', usersRouter);
app.use('/api/preferences', preferencesRouter);""",
        )

    def _generate_from_blueprint(self, blueprint: dict):
        """Generate code based on the blueprint's feature type."""
        feature_lower = blueprint["feature"].lower()

        if "paginat" in feature_lower or "paginate" in feature_lower:
            self._generate_pagination_support()
        elif "export" in feature_lower or "csv" in feature_lower:
            self._generate_export_csv()
        elif "rate limit" in feature_lower or "throttl" in feature_lower:
            self._generate_rate_limiter()
        elif "otp" in feature_lower or "2fa" in feature_lower or "auth" in feature_lower:
            self._generate_otp_auth()
        elif "theme" in feature_lower or "dark" in feature_lower:
            self._generate_preferences()
        elif "label" in feature_lower or "tag" in feature_lower or "categor" in feature_lower:
            self._generate_label_filtering()
        elif "search" in feature_lower:
            self._generate_search()

    async def handle_message(self, message: Message):
        if message.msg_type != "blueprint":
            return

        blueprint = message.content.get("blueprint", {})
        feature = blueprint.get("feature", "Unknown")

        print(f"\n{'='*60}")
        print(f"[Code Gen Agent] Implementing: {feature}")
        print(f"[Code Gen Agent] Files to create: {blueprint.get('files_to_create', [])}")
        print(f"[Code Gen Agent] Files to modify: {blueprint.get('files_to_modify', [])}")

        files_content = {}
        for path in blueprint.get("files_to_modify", []):
            files_content[path] = self.writer.read_file(path)
        llm_changes = await generate_code(blueprint, files_content)
        if llm_changes:
            print(f"[Code Gen Agent] LLM code gen available, using templates for stability")
        print(f"[Code Gen Agent] Using template-based code generation")
        self._generate_from_blueprint(blueprint)

        diff = self.writer.get_diff()
        changed_files = []
        for path in blueprint.get("files_to_create", []) + blueprint.get("files_to_modify", []):
            changed_files.append({
                "path": path,
                "exists": self.writer.file_exists(path),
            })

        print(f"[Code Gen Agent] Generation complete. Posting patch to room...")

        await report_state("code-gen-agent", "done", message.correlation_id, "code_patch", {"feature": feature})

        await self.send(
            content={
                "feature": feature,
                "changed_files": changed_files,
                "diff_summary": diff,
                "status": "generated",
            },
            msg_type="code_patch",
            correlation_id=message.correlation_id,
        )
