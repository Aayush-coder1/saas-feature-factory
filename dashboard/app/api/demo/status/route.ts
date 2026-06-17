import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..", "..", "..", "..", "..");
const STATE_FILE = resolve(PROJECT_ROOT, ".band_store", "demo_state.json");

export async function GET() {
  if (!existsSync(STATE_FILE)) {
    return NextResponse.json({ running: false, result: "No demo has been run yet" });
  }
  try {
    const state = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    return NextResponse.json(state);
  } catch {
    return NextResponse.json({ running: false, result: "State file corrupted" });
  }
}
