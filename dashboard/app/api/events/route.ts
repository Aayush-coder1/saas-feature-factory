import { NextRequest, NextResponse } from "next/server";
import { getEvents, pushEvent } from "@/lib/demo-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, status, featureId, messageType, payload } = body;
    if (!agentId || !status) {
      return NextResponse.json({ error: "agentId and status are required" }, { status: 400 });
    }
    const record = pushEvent({
      agentId,
      status,
      featureId: featureId || "unknown",
      messageType: messageType || "unknown",
      payload: payload || {},
    });
    return NextResponse.json({ ok: true, id: record.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ data: getEvents().slice(0, 100), db: "memory" });
}
