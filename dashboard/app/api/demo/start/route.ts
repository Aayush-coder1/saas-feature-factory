import { NextResponse } from "next/server";
import { spawn, execSync } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

const PROJECT_ROOT = resolve(process.cwd(), "..");
const STATE_DIR = resolve(PROJECT_ROOT, ".demo_state");
const STATE_FILE = resolve(STATE_DIR, "state.json");

function writeState(state: { running: boolean; startedAt: string; result?: string }) {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state));
}

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

let demoProcess: ReturnType<typeof spawn> | null = null;

export async function POST() {
  if (demoProcess) {
    return NextResponse.json({ ok: false, error: "Demo already running" }, { status: 409 });
  }

  try {
    const agentsDir = resolve(PROJECT_ROOT, "agents");
    const pythonCmd = findPython();

    if (!existsSync(agentsDir)) {
      return NextResponse.json({ ok: false, error: `Agents dir not found: ${agentsDir}` }, { status: 500 });
    }

    writeState({ running: true, startedAt: new Date().toISOString() });

    demoProcess = spawn(pythonCmd, ["-m", "agents.orchestrator.cli", "demo"], {
      cwd: agentsDir,
      env: { ...process.env, PYTHONPATH: PROJECT_ROOT, PATH: process.env.PATH },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderrLog = "";
    demoProcess.stderr?.on("data", (data: Buffer) => {
      stderrLog += data.toString();
    });

    demoProcess.on("close", (code: number | null) => {
      writeState({ running: false, startedAt: new Date().toISOString(), result: `Exited with code ${code}` });
      demoProcess = null;
    });

    demoProcess.on("error", (err: Error) => {
      writeState({ running: false, startedAt: new Date().toISOString(), result: `Error: ${err.message}` });
      demoProcess = null;
    });

    return NextResponse.json({ ok: true, message: "Demo started" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
