import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..", "..", "..", "..", "..");
const REQUESTS_DIR = resolve(PROJECT_ROOT, "demo", "dashboard-requests");

export async function POST(req: NextRequest) {
  try {
    const { title, request } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    if (!existsSync(REQUESTS_DIR)) {
      mkdirSync(REQUESTS_DIR, { recursive: true });
    }

    const featureFile = resolve(REQUESTS_DIR, `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`);
    writeFileSync(featureFile, JSON.stringify({ title, request: request || title }, null, 2));

    // Also try to run the feature through the agent pipeline
    const agentsDir = resolve(PROJECT_ROOT, "agents");
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    const proc = spawn(pythonCmd, ["-m", "agents.orchestrator.cli", "request", title, request || title], {
      cwd: agentsDir,
      env: { ...process.env, PYTHONPATH: PROJECT_ROOT },
      stdio: "ignore",
      detached: true,
    });
    proc.unref();

    return NextResponse.json({ ok: true, feature: title });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
