import { NextResponse } from "next/server";
import { startDemo, getDemoState } from "@/lib/demo-store";

export async function POST() {
  const ok = startDemo();
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Demo already running" }, { status: 409 });
  }
  return NextResponse.json({ ok: true, message: "Demo started" });
}

export const runtime = "nodejs";
