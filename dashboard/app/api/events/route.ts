import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const inMemory: Record<string, unknown>[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, status, featureId, messageType, payload } = body;

    if (!agentId || !status) {
      return NextResponse.json({ error: "agentId and status are required" }, { status: 400 });
    }

    const record = {
      id: crypto.randomUUID(),
      agentId,
      status,
      featureId: featureId || "unknown",
      messageType: messageType || "unknown",
      payload: payload || {},
      createdAt: new Date().toISOString(),
    };

    if (prisma) {
      const event = await prisma.agentEvent.create({
        data: {
          agentId: record.agentId,
          status: record.status,
          featureId: record.featureId,
          messageType: record.messageType,
          payload: record.payload,
          createdAt: new Date(record.createdAt),
        },
      });
      return NextResponse.json({ ok: true, id: event.id });
    }

    inMemory.unshift(record);
    if (inMemory.length > 500) inMemory.length = 500;
    return NextResponse.json({ ok: true, id: record.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  if (prisma) {
    try {
      const events = await prisma.agentEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ data: events, db: "postgres" });
    } catch {
      return NextResponse.json({ data: [], db: "postgres_error" });
    }
  }
  return NextResponse.json({ data: inMemory.slice(0, 100), db: "memory" });
}
