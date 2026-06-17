import { NextRequest, NextResponse } from "next/server";
import { spawn, execSync } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

const PROJECT_ROOT = resolve(process.cwd(), "..");
const REQUESTS_DIR = resolve(PROJECT_ROOT, "demo", "dashboard-requests");

function findPython(): string {
  for (const cmd of ["python", "python3", "py"]) {
    try {
      execSync(`${cmd} --version`, { stdio: "ignore" });
      return cmd;
    } catch {
      continue;
    }
  }
  return "python";
}

export async function POST(req: NextRequest) {
  try {
    const { title, request } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const agentsDir = resolve(PROJECT_ROOT, "agents");
    const pythonCmd = findPython();

    const proc = spawn(pythonCmd, ["-m", "agents.orchestrator.cli", "request", title, request || title], {
      cwd: agentsDir,
      env: { ...process.env, PYTHONPATH: PROJECT_ROOT, PATH: process.env.PATH },
      stdio: "ignore",
      detached: true,
    });

    const started = proc.pid !== undefined;
    proc.unref();

    return NextResponse.json({ ok: started, feature: title });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
