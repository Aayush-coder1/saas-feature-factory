"use client";

import { useEffect, useState } from "react";
import { BentoGrid } from "@/components/BentoGrid";
import { AgentCard } from "@/components/AgentCard";
import { PipelineTimeline } from "@/components/PipelineTimeline";
import { LiveFeed } from "@/components/LiveFeed";
import { FeatureQueue } from "@/components/FeatureQueue";

type AgentEvent = {
  id: string;
  agentId: string;
  status: string;
  featureId: string;
  messageType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export default function Home() {
  const [events, setEvents] = useState<AgentEvent[]>([]);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.data || []))
      .catch(() => {});

    const interval = setInterval(() => {
      fetch("/api/events")
        .then((r) => r.json())
        .then((d) => setEvents(d.data || []))
        .catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const latestPerAgent = new Map<string, AgentEvent>();
  for (const e of events) {
    latestPerAgent.set(e.agentId, e);
  }

  const completedFeatures = events
    .filter((e) => e.messageType === "qa_report" && e.payload?.qa_signed_off)
    .map((e) => (e.payload as { feature?: string }).feature)
    .filter((f): f is string => typeof f === "string" && f.length > 0)
    .filter((v, i, a) => a.indexOf(v) === i);

  const timelineEvents = events
    .filter((e) => ["blueprint", "code_patch", "qa_report", "deployment_result"].includes(e.messageType))
    .slice(0, 20);

  const recentFeed = events.slice(0, 50);

  return (
    <div className="min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">SaaS Feature Factory</h1>
        <p className="text-zinc-400 mt-1">Multi-Agent System via Band Collaboration Layer</p>
      </header>

      <BentoGrid>
        <div className="col-span-1 row-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Agent Status</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "spec-agent", label: "Spec", color: "blue" },
              { id: "code-gen-agent", label: "Code Gen", color: "purple" },
              { id: "qa-agent", label: "QA", color: "green" },
              { id: "docs-agent", label: "Docs", color: "amber" },
              { id: "deploy-agent", label: "Deploy", color: "red" },
            ].map((agent) => (
              <AgentCard key={agent.id} agent={agent} event={latestPerAgent.get(agent.id)} />
            ))}
          </div>
        </div>

        <div className="col-span-1 row-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Pipeline Flow</h2>
          <PipelineTimeline events={timelineEvents} />
          <div className="mt-4 p-3 bg-surface-alt rounded-lg border border-border">
            <p className="text-sm text-zinc-400">
              Features completed: <span className="text-white font-bold">{completedFeatures.length}/5</span>
            </p>
          </div>
        </div>

        <div className="col-span-1 row-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Live Feed</h2>
          <LiveFeed events={recentFeed} />
        </div>

        <div className="col-span-1 row-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Feature Queue</h2>
          <FeatureQueue features={completedFeatures} />
        </div>
      </BentoGrid>
    </div>
  );
}
