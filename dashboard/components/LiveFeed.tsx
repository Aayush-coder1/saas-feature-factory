"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";

type AgentEvent = {
  id: string;
  agentId: string;
  messageType: string;
  status: string;
  featureId: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

type Props = { events: AgentEvent[] };

const agentIds = ["spec-agent", "code-gen-agent", "qa-agent", "deploy-agent", "docs-agent"];
const messageTypes = ["feature_request", "blueprint", "code_patch", "qa_report", "deployment_result", "docs_update", "status"];
const statuses = ["done", "deployed", "working", "failed", "idle"];

export function LiveFeed({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [events.length, autoScroll]);

  const filtered = useMemo(() => {
    let list = events;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.agentId.toLowerCase().includes(q) ||
          e.messageType.toLowerCase().includes(q) ||
          e.status.toLowerCase().includes(q) ||
          e.featureId?.toLowerCase().includes(q)
      );
    }
    if (filterAgent) list = list.filter((e) => e.agentId === filterAgent);
    if (filterStatus) list = list.filter((e) => e.status === filterStatus);
    return list;
  }, [events, search, filterAgent, filterStatus]);

  const hasFilters = search || filterAgent || filterStatus;
  const activeFilterCount = [search, filterAgent, filterStatus].filter(Boolean).length;

  const selectedEvent = selectedId ? events.find((e) => e.id === selectedId) : null;

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterAgent(null);
    setFilterStatus(null);
  }, []);

  const toggleAutoScroll = useCallback(() => setAutoScroll((v) => !v), []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="input-base w-full !py-1.5 !text-[12px] mono"
          />
          {search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] focus-ring"
              style={{ color: "var(--ink-tertiary)" }}
              onClick={() => setSearch("")}
            >
              &times;
            </button>
          )}
        </div>
        <button
          className={`btn-secondary !py-1.5 !px-2.5 !text-[11px] mono ${showFilters ? "!border-primary" : ""}`}
          onClick={() => setShowFilters((v) => !v)}
          title="Toggle filters"
        >
          {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : "Filter"}
        </button>
        <button
          className={`btn-secondary !py-1.5 !px-2.5 !text-[11px] mono ${autoScroll ? "" : "!border-primary"}`}
          onClick={toggleAutoScroll}
          title={autoScroll ? "Pause auto-scroll" : "Resume auto-scroll"}
        >
          {autoScroll ? "Auto" : "Paused"}
        </button>
      </div>

      {showFilters && (
        <div className="animate-scale-in mb-3 p-2.5 rounded" style={{ background: "var(--surface-2)" }}>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-mono" style={{ color: "var(--ink-tertiary)", minWidth: 40 }}>Agent</span>
            <div className="flex flex-wrap gap-1">
              <button
                className={`text-[10px] font-mono rounded px-1.5 py-0.5 ${!filterAgent ? "badge-info" : "badge-default"}`}
                onClick={() => setFilterAgent(null)}
              >
                All
              </button>
              {agentIds.map((aid) => (
                <button
                  key={aid}
                  className={`text-[10px] font-mono rounded px-1.5 py-0.5 ${filterAgent === aid ? "badge-info" : "badge-default"}`}
                  onClick={() => setFilterAgent(aid === filterAgent ? null : aid)}
                >
                  {aid.replace("-agent", "")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center mt-1.5">
            <span className="text-[10px] font-mono" style={{ color: "var(--ink-tertiary)", minWidth: 40 }}>Status</span>
            <div className="flex flex-wrap gap-1">
              <button
                className={`text-[10px] font-mono rounded px-1.5 py-0.5 ${!filterStatus ? "badge-info" : "badge-default"}`}
                onClick={() => setFilterStatus(null)}
              >
                All
              </button>
              {statuses.map((s) => (
                <button
                  key={s}
                  className={`text-[10px] font-mono rounded px-1.5 py-0.5 ${filterStatus === s ? "badge-info" : "badge-default"}`}
                  onClick={() => setFilterStatus(s === filterStatus ? null : s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button
              className="text-[10px] font-mono mt-1.5 focus-ring"
              style={{ color: "var(--ink-tertiary)" }}
              onClick={clearFilters}
            >
              &larr; Clear all filters
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mono text-sm" style={{ color: "var(--ink-subtle)" }}>
            {hasFilters ? "No events match filters" : "No events yet"}
          </p>
          {hasFilters && (
            <button className="mono text-xs mt-1 focus-ring" style={{ color: "var(--ink-tertiary)" }} onClick={clearFilters}>
              Clear filters to see all events
            </button>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="max-h-72 overflow-y-auto space-y-0.5 mono">
          {filtered.map((e, i) => (
            <div key={e.id || i}>
              <div
                className={`flex items-center gap-2 px-2 py-1 rounded transition-all cursor-pointer hover:bg-[rgba(255,255,255,0.02)] ${selectedId === e.id ? "bg-[rgba(94,106,210,0.06)]" : ""}`}
                onClick={() => setSelectedId(selectedId === e.id ? null : (e.id || null))}
                onKeyDown={(ev) => { if (ev.key === "Enter") setSelectedId(selectedId === e.id ? null : (e.id || null)); }}
                tabIndex={0}
                role="button"
                aria-expanded={selectedId === e.id}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background:
                      e.status === "done" || e.status === "deployed"
                        ? "var(--success)"
                        : e.status === "failed"
                          ? "var(--error)"
                          : "var(--primary)",
                    opacity: e.status === "idle" ? 0.3 : 1,
                  }}
                />
                <span className="text-[10px] shrink-0 font-medium" style={{ color: "var(--ink-muted)", minWidth: 60 }}>
                  {e.agentId.replace("-agent", "")}
                </span>
                <span className="flex-1 truncate text-[11px]" style={{ color: "var(--ink-subtle)" }}>
                  {e.messageType.replace(/_/g, " ")}
                </span>
                <span
                  className="text-[10px] shrink-0 hidden sm:inline"
                  style={{
                    color:
                      e.status === "done" || e.status === "deployed"
                        ? "var(--success)"
                        : e.status === "failed"
                          ? "var(--error)"
                          : e.status === "working"
                            ? "var(--primary)"
                            : "var(--ink-tertiary)",
                  }}
                >
                  {e.status}
                </span>
                <span className="text-[10px] shrink-0" style={{ color: "var(--ink-tertiary)", minWidth: 50, textAlign: "right" }}>
                  {new Date(e.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {selectedId === e.id && selectedEvent && (
                <div className="animate-scale-in ml-4 mr-2 mb-1 p-2 rounded" style={{ background: "var(--surface-2)" }}>
                  <div className="mono text-[10px] space-y-0.5">
                    <div>
                      <span style={{ color: "var(--ink-tertiary)" }}>Event: </span>
                      <span style={{ color: "var(--ink-muted)" }}>{selectedEvent.id}</span>
                    </div>
                    {selectedEvent.featureId && (
                      <div>
                        <span style={{ color: "var(--ink-tertiary)" }}>Feature: </span>
                        <span style={{ color: "var(--ink-muted)" }}>{selectedEvent.featureId}</span>
                      </div>
                    )}
                    <div>
                      <span style={{ color: "var(--ink-tertiary)" }}>Time: </span>
                      <span style={{ color: "var(--ink-muted)" }}>{new Date(selectedEvent.createdAt).toLocaleString()}</span>
                    </div>
                    {selectedEvent.payload && Object.keys(selectedEvent.payload).length > 0 && (
                      <pre className="mt-1 text-[10px] whitespace-pre-wrap" style={{ color: "var(--ink-muted)", maxHeight: 100, overflow: "hidden" }}>
                        {JSON.stringify(selectedEvent.payload, null, 2).slice(0, 200)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
