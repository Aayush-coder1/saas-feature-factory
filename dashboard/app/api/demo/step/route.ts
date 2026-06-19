import { NextResponse } from "next/server";
import { getStep } from "@/lib/demo-store";

export async function GET() {
  const step = getStep();
  if (!step.active) {
    return NextResponse.json({ active: false });
  }
  return NextResponse.json(step);
}

export const runtime = "nodejs";
