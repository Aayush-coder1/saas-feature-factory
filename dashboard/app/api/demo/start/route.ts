import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { resolve } from "path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..", "..", "..", "..", "..");
const BAND_STORE = resolve(PROJECT_ROOT, ".band_store");
const STATE_FILE = resolve(BAND_STORE, "demo_state.json");

function writeState(state: { running: boolean; startedAt: string; result?: string }) {
  if (!existsSync(BAND_STORE)) mkdirSync(BAND_STORE, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state));
}

let demoProcess: ReturnType<typeof spawn> | null = null;

export async function POST() {
  if (demoProcess) {
    return NextResponse.json({ ok: false, error: "Demo already running" }, { status: 409 });
  }

  try {
    const agentsDir = resolve(PROJECT_ROOT, "agents");
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    writeState({ running: true, startedAt: new Date().toISOString() });

    demoProcess = spawn(pythonCmd, ["-m", "agents.orchestrator.cli", "demo"], {
      cwd: agentsDir,
      env: { ...process.env, PYTHONPATH: PROJECT_ROOT },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    demoProcess.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
    });
    demoProcess.stderr?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    demoProcess.on("close", (code: number | null) => {
      writeState({ running: false, startedAt: new Date().toISOString(), result: `Exited with code ${code}` });
      demoProcess = null;
    });

    demoProcess.on("error", () => {
      writeState({ running: false, startedAt: new Date().toISOString(), result: "Failed to start" });
      demoProcess = null;
    });

    return NextResponse.json({ ok: true, message: "Demo started" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
