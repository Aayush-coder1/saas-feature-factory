import { NextRequest, NextResponse } from "next/server";
import { submitFeature } from "@/lib/demo-store";

export async function POST(req: NextRequest) {
  try {
    const { title, request } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    submitFeature(title, request || title);
    return NextResponse.json({ ok: true, feature: title });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
