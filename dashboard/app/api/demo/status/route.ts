import { NextResponse } from "next/server";
import { getDemoState } from "@/lib/demo-store";

export async function GET() {
  const state = getDemoState();
  if (!state.startedAt) {
    return NextResponse.json({ running: false, result: "No demo has been run yet" });
  }
  return NextResponse.json(state);
}

export const runtime = "nodejs";
