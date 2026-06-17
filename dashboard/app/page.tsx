"use client";

import { useEffect, useState, useCallback } from "react";
import { AgentCard } from "@/components/AgentCard";
import { PipelineTimeline } from "@/components/PipelineTimeline";
import { LiveFeed } from "@/components/LiveFeed";
import { FeatureQueue } from "@/components/FeatureQueue";
import { FeatureRequestForm } from "@/components/FeatureRequestForm";

export type AgentEvent = {
  id: string;
  agentId: string;
  status: string;
  featureId: string;
  messageType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

const AGENTS = [
  { id: "spec-agent", label: "Spec", color: "blue", icon: "🔍" },
  { id: "code-gen-agent", label: "Code Gen", color: "purple", icon: "⚡" },
  { id: "qa-agent", label: "QA", color: "green", icon: "🧪" },
  { id: "deploy-agent", label: "Deploy", color: "red", icon: "🚀" },
  { id: "docs-agent", label: "Docs", color: "amber", icon: "📝" },
] as const;

export default function Home() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);

  const fetchEvents = useCallback(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 2000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const latestPerAgent = new Map<string, AgentEvent>();
  for (const e of events) {
    latestPerAgent.set(e.agentId, e);
  }

  const completedFeatures = events
    .filter((e) => e.messageType === "qa_report" && (e.payload as { qa_signed_off?: boolean })?.qa_signed_off)
    .map((e) => (e.payload as { feature?: string }).feature)
    .filter((f): f is string => typeof f === "string" && f.length > 0)
    .filter((v, i, a) => a.indexOf(v) === i);

  const timelineEvents = events
    .filter((e) => ["blueprint", "code_patch", "qa_report", "deployment_result"].includes(e.messageType))
    .slice(0, 20);

  const recentFeed = events.slice(0, 50);

  const runDemo = async () => {
    setDemoRunning(true);
    setDemoStatus("Starting demo...");
    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setDemoStatus("Demo running...");
        const poll = setInterval(() => {
          fetchEvents();
          fetch("/api/demo/status")
            .then((r) => r.json())
            .then((s) => {
              if (s.running === false) {
                setDemoRunning(false);
                setDemoStatus(s.result || "Demo complete!");
                clearInterval(poll);
                fetchEvents();
              }
            })
            .catch(() => {});
        }, 2000);
      } else {
        setDemoRunning(false);
        setDemoStatus(data.error || "Failed to start");
      }
    } catch {
      setDemoRunning(false);
      setDemoStatus("Failed to start demo");
    }
  };

  const submitFeature = async (title: string, description: string) => {
    const res = await fetch("/api/demo/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, request: description }),
    });
    return res.ok;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full bg-pink-500/5 blur-[100px] animate-float" style={{ animationDelay: "-1.5s" }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-zinc-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-glow" />
            Multi-Agent System v1.0
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            <span className="text-gradient">SaaS Feature Factory</span>
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base max-w-xl mx-auto">
            Five autonomous AI agents collaborate to spec, code, test, deploy, and document new features
          </p>
        </header>

        {/* Feature Request + Demo Control */}
        <FeatureRequestForm
          onSubmit={submitFeature}
          onRunDemo={runDemo}
          demoRunning={demoRunning}
          demoStatus={demoStatus}
        />

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-8">
          {/* Agent Status - spans 5 cols */}
          <div className="lg:col-span-5 glass rounded-xl p-5 glow-white animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Agent Status</h2>
              <span className="text-xs text-zinc-600">{events.length} events</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AGENTS.map((agent) => (
                <AgentCard key={agent.id} agent={agent} event={latestPerAgent.get(agent.id)} />
              ))}
            </div>
          </div>

          {/* Pipeline Flow - spans 4 cols */}
          <div className="lg:col-span-4 glass rounded-xl p-5 glow-white animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Pipeline Flow</h2>
              <span className="text-xs text-zinc-600">{completedFeatures.length}/5</span>
            </div>
            <PipelineTimeline events={timelineEvents} />
          </div>

          {/* Feature Queue - spans 3 cols */}
          <div className="lg:col-span-3 glass rounded-xl p-5 glow-white animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Feature Queue</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${completedFeatures.length === 5 ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>
                {completedFeatures.length}/5 done
              </span>
            </div>
            <FeatureQueue features={completedFeatures} />
          </div>

          {/* Live Feed - full width */}
          <div className="lg:col-span-12 glass rounded-xl p-5 glow-white animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Live Event Feed</h2>
              {recentFeed.length > 0 && (
                <span className="text-xs text-zinc-600">{recentFeed.length} events</span>
              )}
            </div>
            <LiveFeed events={recentFeed} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-zinc-700 pb-8">
          Built with Next.js 15 · Tailwind CSS v4 · Python Agents · Express API
        </footer>
      </div>
    </div>
  );
}
