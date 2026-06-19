"use client";

import { useState, useCallback } from "react";

type AgentEvent = {
  id: string;
  agentId: string;
  messageType: string;
  featureId: string;
  status: string;
  createdAt: string;
};

type Props = { features: string[]; events?: AgentEvent[] };

const allFeatures = [
  { title: "Add CSV Export", icon: "CSV", desc: "Export tasks as CSV via new endpoint" },
  { title: "Add Dark Mode", icon: "DM", desc: "Theme preference with dark mode toggle" },
  { title: "Add Label Filtering", icon: "LF", desc: "Filter tasks by label/category" },
  { title: "Add OTP Auth", icon: "OTP", desc: "Two-factor authentication support" },
  { title: "Add Pagination", icon: "PG", desc: "Page and limit query params for tasks" },
];

const agentIcons: Record<string, string> = {
  "spec-agent": "S",
  "code-gen-agent": "C",
  "qa-agent": "Q",
  "deploy-agent": "D",
  "docs-agent": "Dc",
};

export function FeatureQueue({ features, events = [] }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = useCallback((i: number) => {
    setExpanded((v) => (v === i ? null : i));
  }, []);

  return (
    <div className="space-y-2">
      {allFeatures.map((f, i) => {
        const completed = features.some((c) => f.title.includes(c) || c.includes(f.title));
        const isExpanded = expanded === i;

        const featureEvents = events.filter(
          (e) => e.featureId && (f.title.toLowerCase().includes(e.featureId.toLowerCase()) || e.featureId.includes(String(i)))
        );
        const steps = ["blueprint", "code_patch", "qa_report", "deployment_result"];
        const completedSteps = steps.filter((s) => featureEvents.some((e) => e.messageType === s));
        const stepCount = completedSteps.length;

        return (
          <div key={i}>
            <div
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer select-none ${isExpanded ? "rounded-b-none" : ""}`}
              style={{
                background: completed ? "rgba(39, 166, 68, 0.05)" : "var(--surface-1)",
                border: completed
                  ? "1px solid rgba(39, 166, 68, 0.2)"
                  : isExpanded
                    ? "1px solid var(--hairline-strong)"
                    : "1px solid var(--hairline)",
              }}
              onClick={() => toggle(i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i); } }}
              tabIndex={0}
              role="button"
              aria-expanded={isExpanded}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0 transition-all"
                style={{
                  background: completed ? "rgba(39, 166, 68, 0.2)" : "var(--surface-2)",
                  color: completed ? "var(--success)" : "var(--ink-tertiary)",
                }}
              >
                {completed ? "✓" : f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm transition-all" style={{ color: completed ? "var(--ink)" : "var(--ink-subtle)" }}>
                  {f.title}
                </span>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--ink-tertiary)" }}>
                  {f.desc}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-14 h-1.5 rounded-full overflow-hidden hidden sm:block" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: completed ? "100%" : `${(stepCount / steps.length) * 100}%`, background: completed ? "var(--success)" : "var(--primary)" }}
                  />
                </div>
                <span className={`badge ${completed ? "badge-success" : stepCount > 0 ? "badge-info" : "badge-default"} !text-[10px] !px-1.5`}>
                  {completed ? "Done" : stepCount > 0 ? `${stepCount}/${steps.length}` : "Pending"}
                </span>
              </div>
            </div>

            {isExpanded && (
              <div
                className="animate-slide-down px-3 py-2 rounded-b-lg space-y-1"
                style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", borderTop: "none" }}
              >
                {featureEvents.length === 0 && (
                  <p className="mono text-[10px] py-1" style={{ color: "var(--ink-tertiary)" }}>
                    No pipeline events recorded for this feature
                  </p>
                )}
                {featureEvents.slice(0, 6).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 py-0.5">
                    <span className="w-3.5 h-3.5 rounded text-[8px] font-semibold flex items-center justify-center shrink-0" style={{ background: "var(--surface-1)", color: "var(--ink-muted)" }}>
                      {agentIcons[ev.agentId] || "?"}
                    </span>
                    <span className="mono text-[10px]" style={{ color: "var(--ink-muted)", minWidth: 70 }}>
                      {ev.agentId.replace("-agent", "")}
                    </span>
                    <span className="mono text-[10px] flex-1 truncate" style={{ color: "var(--ink-subtle)" }}>
                      {ev.messageType.replace(/_/g, " ")}
                    </span>
                    <span
                      className="mono text-[10px]"
                      style={{
                        color:
                          ev.status === "done" || ev.status === "deployed"
                            ? "var(--success)"
                            : ev.status === "failed"
                              ? "var(--error)"
                              : "var(--ink-tertiary)",
                      }}
                    >
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
