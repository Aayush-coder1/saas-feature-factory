import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const PROJECT_ROOT = resolve(process.cwd(), "..");
const STEP_FILE = resolve(PROJECT_ROOT, ".demo_state", "step.json");

export async function GET() {
  if (!existsSync(STEP_FILE)) {
    return NextResponse.json({ active: false });
  }
  try {
    const step = JSON.parse(readFileSync(STEP_FILE, "utf-8"));
    return NextResponse.json({ active: true, ...step });
  } catch {
    return NextResponse.json({ active: false });
  }
}
