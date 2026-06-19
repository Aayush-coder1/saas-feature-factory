"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  { id: "spec-agent", label: "Spec", color: "blue", icon: "S" },
  { id: "code-gen-agent", label: "Code Gen", color: "purple", icon: "C" },
  { id: "qa-agent", label: "QA", color: "green", icon: "Q" },
  { id: "deploy-agent", label: "Deploy", color: "red", icon: "D" },
  { id: "docs-agent", label: "Docs", color: "amber", icon: "Dc" },
] as const;

type DemoStep = {
  active: boolean;
  feature?: string;
  feature_index?: number;
  total_features?: number;
  agent?: string;
  stage?: string;
  status?: string;
};

const AGENT_ORDER = ["spec-agent", "code-gen-agent", "qa-agent", "deploy-agent", "docs-agent"];

type Toast = { id: number; message: string; type: "success" | "error" | "info" };

export default function Home() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<DemoStep | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const toastCounter = useRef(0);
  const prevEventCount = useRef(0);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const fetchEvents = useCallback(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => {
        const list: AgentEvent[] = d.data || [];
        setEvents(list);
        if (list.length > prevEventCount.current) {
          setEventCount(list.length);
        }
        prevEventCount.current = list.length;
      })
      .catch(() => {});
  }, []);

  const fetchStep = useCallback(() => {
    fetch("/api/demo/step")
      .then((r) => r.json())
      .then((s) => setCurrentStep(s))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 2000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  useEffect(() => {
    if (!demoRunning) return;
    fetchStep();
    const interval = setInterval(fetchStep, 1500);
    return () => clearInterval(interval);
  }, [demoRunning, fetchStep]);

  useEffect(() => {
    if (eventCount > 0 && eventCount % 5 === 0) {
      addToast(`${eventCount} events recorded`, "info");
    }
  }, [eventCount, addToast]);

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

  const runDemo = useCallback(async () => {
    setDemoRunning(true);
    setDemoStatus("Starting demo...");
    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setDemoStatus("Demo running...");
        addToast("Demo started — 5 features in queue", "info");
        const poll = setInterval(async () => {
          fetchEvents();
          try {
            const sr = await fetch("/api/demo/status");
            const s = await sr.json();
            if (s.running === false) {
              setDemoRunning(false);
              setDemoStatus(s.result || "Demo complete!");
              clearInterval(poll);
              fetchEvents();
              const passed = s.result?.includes("successfully") || s.completed === s.total;
              addToast(passed ? "Demo complete! All features processed." : "Demo finished with some failures", passed ? "success" : "error");
            }
          } catch {
            setDemoStatus("Status check failed (retrying...)");
          }
        }, 2000);
      } else {
        setDemoRunning(false);
        setDemoStatus(data.error || "Failed to start");
        addToast(data.error || "Failed to start demo", "error");
      }
    } catch (err) {
      setDemoRunning(false);
      setDemoStatus(`Failed: ${err instanceof Error ? err.message : "unknown error"}`);
      addToast("Demo failed to start", "error");
    }
  }, [fetchEvents, addToast]);

  const submitFeature = async (title: string, description: string) => {
    const res = await fetch("/api/demo/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, request: description }),
    });
    if (res.ok) addToast(`Feature submitted: ${title}`, "success");
    return res.ok;
  };

  const currentAgentIdx = currentStep?.agent ? AGENT_ORDER.indexOf(currentStep.agent) : -1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "r" || e.key === "R") {
        if (!demoRunning) runDemo();
      }
      if (e.key >= "1" && e.key <= "5") {
        const idx = parseInt(e.key) - 1;
        if (idx < AGENTS.length) setSelectedAgent(selectedAgent === AGENTS[idx].id ? null : AGENTS[idx].id);
      }
      if (e.key === "Escape") setSelectedAgent(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [demoRunning, runDemo, selectedAgent]);

  return (
    <div className="min-h-screen" style={{ background: "var(--canvas)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <header className="flex items-center justify-between mb-8 pb-4 hairline-bottom">
          <div className="flex items-center gap-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              S
            </div>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: "var(--ink)" }}>
                SaaS Feature Factory
              </h1>
              <p className="text-xs" style={{ color: "var(--ink-subtle)" }}>
                Five autonomous AI agents
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono text-[10px] hidden sm:inline" style={{ color: "var(--ink-tertiary)" }}>
              {events.length} events
            </span>
            <div className="badge badge-info">
              v1.0
            </div>
          </div>
        </header>

        <FeatureRequestForm
          onSubmit={submitFeature}
          onRunDemo={runDemo}
          demoRunning={demoRunning}
          demoStatus={demoStatus}
        />

        {demoRunning && currentStep?.active && (
          <div className="card mt-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--primary)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--ink-muted)" }}>
                  Processing: <span style={{ color: "var(--primary)" }}>{currentStep.feature}</span>
                </span>
              </div>
              <span className="text-xs mono" style={{ color: "var(--ink-subtle)" }}>
                {currentStep.feature_index! + 1} / {currentStep.total_features}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "var(--surface-2)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${((currentStep.feature_index! + 1) / currentStep.total_features!) * 100}%`,
                  background: "var(--primary)",
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              {AGENT_ORDER.map((aid, i) => {
                const agent = AGENTS.find((a) => a.id === aid)!;
                const isCurrent = currentStep.agent === aid;
                const isDone = currentAgentIdx > i;
                return (
                  <div key={aid} className="flex items-center gap-1 flex-1">
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all ${
                        isCurrent ? "badge badge-info" : isDone ? "badge badge-success" : "badge badge-default"
                      }`}
                      style={isCurrent ? { border: "1px solid var(--primary)" } : {}}
                    >
                      <span>{agent.icon}</span>
                      <span className="hidden sm:inline">{agent.label}</span>
                    </div>
                    {i < AGENT_ORDER.length - 1 && (
                      <div
                        className="h-px flex-1"
                        style={{ background: isDone ? "var(--primary)" : "var(--hairline)" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid-bento mt-6">
          <div className="card lg:col-span-5 animate-slide-up" style={{ animationDelay: "0s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-subtle)" }}>
                Agent Status
              </h2>
              <div className="flex items-center gap-2">
                {selectedAgent && (
                  <button
                    className="text-[10px] font-mono focus-ring"
                    style={{ color: "var(--ink-tertiary)" }}
                    onClick={() => setSelectedAgent(null)}
                  >
                    &larr; Clear
                  </button>
                )}
                <span className="mono text-[10px]" style={{ color: "var(--ink-tertiary)" }}>
                  {events.length} events
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AGENTS.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  event={latestPerAgent.get(agent.id)}
                  allEvents={events}
                  onSelect={setSelectedAgent}
                  selected={selectedAgent === agent.id}
                />
              ))}
            </div>
          </div>

          <div className="card lg:col-span-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-subtle)" }}>
                Pipeline Flow
              </h2>
              <span className="text-xs" style={{ color: "var(--ink-subtle)" }}>
                {completedFeatures.length}/5
              </span>
            </div>
            <PipelineTimeline events={timelineEvents} />
          </div>

          <div className="card lg:col-span-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-subtle)" }}>
                Feature Queue
              </h2>
              <span
                className={`badge ${completedFeatures.length === 5 ? "badge-success" : "badge-default"}`}
              >
                {completedFeatures.length}/5
              </span>
            </div>
            <FeatureQueue features={completedFeatures} events={events} />
          </div>

          <div className="card lg:col-span-12 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-subtle)" }}>
                Live Event Feed
              </h2>
              {recentFeed.length > 0 && (
                <span className="mono text-[10px]" style={{ color: "var(--ink-tertiary)" }}>
                  {recentFeed.length} events
                </span>
              )}
            </div>
            <LiveFeed events={recentFeed} />
          </div>
        </div>

        <footer className="mt-10 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs" style={{ color: "var(--ink-tertiary)" }}>
              Next.js 15 · Tailwind CSS v4 · Python Agents · Express API
            </p>
            <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: "var(--ink-tertiary)" }}>
              <span><kbd className="px-1 py-0.5 rounded" style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}>R</kbd> Run demo</span>
              <span><kbd className="px-1 py-0.5 rounded" style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}>1-5</kbd> Select agent</span>
              <span><kbd className="px-1 py-0.5 rounded" style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}>Esc</kbd> Clear</span>
            </div>
          </div>
        </footer>
      </div>

      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 320 }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in pointer-events-auto px-3 py-2 rounded-lg shadow-lg text-xs"
            style={{
              background: t.type === "success"
                ? "rgba(39, 166, 68, 0.15)"
                : t.type === "error"
                  ? "rgba(229, 72, 77, 0.15)"
                  : "rgba(94, 106, 210, 0.15)",
              border: `1px solid ${
                t.type === "success"
                  ? "rgba(39, 166, 68, 0.3)"
                  : t.type === "error"
                    ? "rgba(229, 72, 77, 0.3)"
                    : "rgba(94, 106, 210, 0.3)"
              }`,
              color: t.type === "success"
                ? "var(--success)"
                : t.type === "error"
                  ? "var(--error)"
                  : "var(--primary)",
              backdropFilter: "blur(8px)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
