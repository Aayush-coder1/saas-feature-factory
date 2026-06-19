"use client";

import { useState, useMemo, useCallback } from "react";

type AgentEvent = {
  id: string;
  agentId: string;
  messageType: string;
  featureId: string;
  status: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

type Props = { events: AgentEvent[] };

const agentMeta: Record<string, { label: string; icon: string }> = {
  "spec-agent": { label: "Spec", icon: "S" },
  "code-gen-agent": { label: "CodeGen", icon: "C" },
  "qa-agent": { label: "QA", icon: "Q" },
  "docs-agent": { label: "Docs", icon: "Dc" },
  "deploy-agent": { label: "Deploy", icon: "D" },
};

const stepOrder = ["blueprint", "code_patch", "docs_updated", "qa_report", "deployment_result"];
const agentIds = Object.keys(agentMeta);

export function PipelineTimeline({ events }: Props) {
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeature, setShowFeature] = useState<string | null>(null);

  const features = useMemo(() => {
    const f = new Set<string>();
    events.forEach((e) => { if (e.featureId) f.add(e.featureId); });
    return Array.from(f).slice(0, 8);
  }, [events]);

  const filtered = useMemo(() => {
    let list = [...events].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    if (filterAgent) list = list.filter((e) => e.agentId === filterAgent);
    if (showFeature) list = list.filter((e) => e.featureId === showFeature);
    return list;
  }, [events, filterAgent, showFeature]);

  const hasFilters = filterAgent || showFeature;

  const selectedEvent = selected ? events.find((e) => e.id === selected) : null;

  const clearFilters = useCallback(() => {
    setFilterAgent(null);
    setShowFeature(null);
    setSelected(null);
  }, []);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="mono text-xs" style={{ color: "var(--ink-subtle)" }}>Waiting for pipeline activity...</p>
        <p className="mono text-[10px] mt-1" style={{ color: "var(--ink-tertiary)" }}>Submit a feature or run the demo</p>
      </div>
    );
  }

  return (
    <div>
      {features.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-3">
          <button
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-all focus-ring ${!showFeature ? "badge-info" : "badge-default"}`}
            style={{ border: !showFeature ? "1px solid var(--primary)" : "1px solid transparent" }}
            onClick={() => setShowFeature(null)}
          >
            All
          </button>
          {features.map((fid) => (
            <button
              key={fid}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-all focus-ring ${showFeature === fid ? "badge-info" : "badge-default"}`}
              style={showFeature === fid ? { border: "1px solid var(--primary)" } : { border: "1px solid transparent" }}
              onClick={() => setShowFeature(fid === showFeature ? null : fid)}
            >
              {fid.slice(0, 8)}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        <button
          className={`text-[10px] font-mono rounded px-2 py-0.5 transition-all focus-ring ${!filterAgent ? "badge-success" : "badge-default"}`}
          onClick={() => setFilterAgent(null)}
        >
          All agents
        </button>
        {agentIds.map((aid) => (
          <button
            key={aid}
            className={`text-[10px] font-mono rounded px-2 py-0.5 transition-all focus-ring ${filterAgent === aid ? "badge-info" : "badge-default"}`}
            onClick={() => setFilterAgent(aid === filterAgent ? null : aid)}
          >
            {agentMeta[aid]?.icon} {agentMeta[aid]?.label}
          </button>
        ))}
      </div>

      {hasFilters && (
        <button
          className="text-[10px] font-mono mb-2 focus-ring"
          style={{ color: "var(--ink-tertiary)" }}
          onClick={clearFilters}
        >
          &larr; Clear filters
        </button>
      )}

      {filtered.length === 0 && hasFilters && (
        <p className="mono text-xs py-4 text-center" style={{ color: "var(--ink-subtle)" }}>
          No events match the current filter
        </p>
      )}

      <div className="space-y-0">
        {filtered.map((e, i) => {
          const meta = agentMeta[e.agentId];
          const label = meta?.label || e.agentId;
          const step = stepOrder.indexOf(e.messageType);
          const isActive = step >= 0;
          const isSelected = selected === e.id;

          return (
            <div key={e.id || i}>
              <div
                className={`flex gap-3 py-2 group cursor-pointer rounded transition-colors ${isSelected ? "bg-[rgba(94,106,210,0.06)]" : "hover:bg-[rgba(255,255,255,0.02)]"}`}
                onClick={() => setSelected(isSelected ? null : e.id || null)}
                onKeyDown={(ev) => { if (ev.key === "Enter") setSelected(isSelected ? null : e.id || null); }}
                tabIndex={0}
                role="button"
                aria-expanded={isSelected}
              >
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-2 h-2 rounded-full transition-all duration-200"
                    style={{
                      background: isActive ? "var(--primary)" : "var(--surface-2)",
                      boxShadow: isActive ? "0 0 0 3px rgba(94, 106, 210, 0.2)" : "none",
                    }}
                  />
                  {i < filtered.length - 1 && (
                    <div className="w-px flex-1 min-h-[16px]" style={{ background: isActive ? "var(--hairline)" : "var(--surface-2)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded text-[10px] font-semibold flex items-center justify-center shrink-0"
                      style={{ background: "var(--surface-2)", color: "var(--ink-muted)" }}
                    >
                      {meta?.icon || "?"}
                    </span>
                    <span className="text-xs font-medium" style={{ color: "var(--ink)" }}>{label}</span>
                    <span className={`badge ${isActive ? "badge-info" : "badge-default"} !text-[10px] !px-1.5`}>
                      {e.messageType.replace(/_/g, " ")}
                    </span>
                    <span className="ml-auto mono text-[10px]" style={{ color: "var(--ink-tertiary)" }}>
                      {new Date(e.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              {isSelected && selectedEvent && (
                <div className="animate-slide-down ml-6 mb-2 p-3 rounded" style={{ background: "var(--surface-2)" }}>
                  <div className="mono text-[11px] space-y-1">
                    <div className="flex gap-2">
                      <span style={{ color: "var(--ink-tertiary)", minWidth: 80 }}>Event ID</span>
                      <span style={{ color: "var(--ink-muted)" }}>{selectedEvent.id.slice(0, 12)}...</span>
                    </div>
                    <div className="flex gap-2">
                      <span style={{ color: "var(--ink-tertiary)", minWidth: 80 }}>Feature</span>
                      <span style={{ color: "var(--ink-muted)" }}>{selectedEvent.featureId?.slice(0, 12) || "—"}</span>
                    </div>
                    <div className="flex gap-2">
                      <span style={{ color: "var(--ink-tertiary)", minWidth: 80 }}>Status</span>
                      <span style={{ color: "var(--ink-muted)" }}>{selectedEvent.status || "—"}</span>
                    </div>
                    <div className="flex gap-2">
                      <span style={{ color: "var(--ink-tertiary)", minWidth: 80 }}>Time</span>
                      <span style={{ color: "var(--ink-muted)" }}>
                        {new Date(selectedEvent.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {selectedEvent.payload && Object.keys(selectedEvent.payload).length > 0 && (
                      <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--hairline)" }}>
                        <span style={{ color: "var(--ink-tertiary)" }}>Payload</span>
                        <pre className="mt-1 text-[10px] whitespace-pre-wrap" style={{ color: "var(--ink-muted)" }}>
                          {JSON.stringify(selectedEvent.payload, null, 2).slice(0, 300)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
