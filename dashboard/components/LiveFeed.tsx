"use client";

import { useEffect, useRef } from "react";

type Event = {
  agentId: string;
  messageType: string;
  status: string;
  featureId: string;
  createdAt: string;
};

type Props = { events: Event[] };

const agentColors: Record<string, string> = {
  "spec-agent": "text-blue-400",
  "code-gen-agent": "text-purple-400",
  "qa-agent": "text-green-400",
  "docs-agent": "text-amber-400",
  "deploy-agent": "text-red-400",
};

const agentIcons: Record<string, string> = {
  "spec-agent": "🔍",
  "code-gen-agent": "⚡",
  "qa-agent": "🧪",
  "docs-agent": "📝",
  "deploy-agent": "🚀",
};

export function LiveFeed({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-3 opacity-20">📡</div>
        <p className="text-sm text-zinc-600 italic">No events yet</p>
        <p className="text-xs text-zinc-700 mt-1">Run the demo pipeline to see agent activity in real-time</p>
      </div>
    );
  }

  return (
    <div className="max-h-72 overflow-y-auto space-y-0.5 text-xs font-mono">
      {events.map((e, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.02] transition-colors animate-slide-up"
          style={{ animationDelay: `${i * 0.02}s` }}
        >
          <span className="text-[10px] shrink-0">{agentIcons[e.agentId] || "•"}</span>
          <span className={`shrink-0 w-14 truncate text-[11px] ${agentColors[e.agentId] || "text-zinc-400"}`}>
            {e.agentId.replace("-agent", "")}
          </span>
          <span className={`text-[11px] shrink-0 px-1.5 py-0.5 rounded ${
            e.status === "done" || e.status === "deployed" ? "bg-green-500/10 text-green-400" :
            e.status === "failed" ? "bg-red-500/10 text-red-400" :
            "bg-zinc-800 text-zinc-500"
          }`}>
            {e.status}
          </span>
          <span className="text-zinc-600 truncate flex-1 text-[11px]">
            {e.messageType.replace(/_/g, " ")}
          </span>
          <span className="text-zinc-700 shrink-0 text-[10px]">
            {new Date(e.createdAt).toLocaleTimeString()}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
