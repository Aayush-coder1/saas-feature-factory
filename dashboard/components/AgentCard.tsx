"use client";

import { useState, useCallback, useId } from "react";

type AgentEvent = {
  id: string;
  agentId: string;
  status: string;
  messageType: string;
  featureId: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

type Props = {
  agent: { id: string; label: string; color: string; icon: string };
  event?: AgentEvent | null;
  allEvents?: AgentEvent[];
  onSelect?: (agentId: string) => void;
  selected?: boolean;
};

const stageOrder = ["feature_request", "blueprint", "code_patch", "qa_report", "deployment_result", "docs_update"];

function stageIndex(mt: string) {
  const i = stageOrder.indexOf(mt);
  return i < 0 ? stageOrder.length : i;
}

export function AgentCard({ agent, event, allEvents = [], onSelect, selected }: Props) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const panelId = `${id}-panel`;

  const status = event?.status || "idle";
  const isActive = status !== "idle";

  const agentEvents = allEvents.filter((e) => e.agentId === agent.id);
  const latestStage = Math.max(-1, ...agentEvents.map((e) => stageIndex(e.messageType)));

  const statusBadge: Record<string, string> = {
    done: "badge badge-success",
    deployed: "badge badge-success",
    working: "badge badge-info",
    failed: "badge badge-error",
    idle: "badge badge-default",
  };

  const stageLabels = ["Feature", "Blueprint", "Code", "QA", "Deploy", "Docs"];

  const toggle = useCallback(() => {
    setExpanded((v) => !v);
    if (onSelect && !expanded) onSelect(agent.id);
  }, [onSelect, expanded, agent.id]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  return (
    <div
      className={`card !p-4 transition-all duration-200 cursor-pointer select-none ${selected ? "!border-primary" : ""}`}
      style={{
        borderColor: isActive && !selected ? "var(--primary)" : expanded || selected ? "var(--primary)" : undefined,
        borderWidth: expanded || selected ? "1px" : undefined,
      }}
      onClick={toggle}
      onKeyDown={handleKey}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      aria-controls={panelId}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold transition-all duration-200"
          style={{
            background: isActive || expanded ? "var(--primary)" : "var(--surface-2)",
            color: isActive || expanded ? "#fff" : "var(--ink-muted)",
          }}
        >
          {agent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
            {agent.label}
          </span>
          <p
            className={`text-[10px] uppercase tracking-wider mt-0.5 ${statusBadge[status] || statusBadge.idle} badge inline-block !text-[10px] !px-1.5`}
          >
            {status}
          </p>
        </div>
        {agentEvents.length > 0 && (
          <span className="text-[10px] font-mono" style={{ color: "var(--ink-tertiary)" }}>
            {agentEvents.length}
          </span>
        )}
      </div>

      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: status === "done" || status === "deployed" ? "100%" : isActive ? "66%" : "0%",
            background: status === "failed" ? "var(--error)" : "var(--primary)",
            opacity: isActive && !["done", "deployed", "failed"].includes(status) ? 0.6 : 1,
          }}
        />
      </div>

      {event && !expanded && (
        <p className="mono mt-2 truncate" style={{ color: "var(--ink-tertiary)" }}>
          {event.messageType.replace(/_/g, " ")}
        </p>
      )}

      {expanded && (
        <div id={panelId} className="animate-slide-down mt-3 space-y-2">
          <div className="flex gap-1">
            {stageLabels.map((label, i) => (
              <div
                key={label}
                className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{
                  background: i <= latestStage ? "var(--primary)" : "var(--surface-2)",
                  opacity: i <= latestStage ? 1 : 0.4,
                }}
              />
            ))}
          </div>
          <div className="flex gap-1 text-[10px] font-mono mb-2" style={{ color: "var(--ink-tertiary)" }}>
            {stageLabels.map((label, i) => (
              <span key={label} className="flex-1 text-center" style={{ opacity: i <= latestStage ? 1 : 0.4 }}>
                {label}
              </span>
            ))}
          </div>

          {agentEvents.length === 0 && (
            <p className="mono text-[11px] py-2" style={{ color: "var(--ink-tertiary)" }}>
              No activity yet
            </p>
          )}

          {agentEvents.slice(0, 8).map((ev, i) => (
            <div
              key={ev.id || i}
              className="flex items-center gap-2 py-1 animate-fade-in"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <span
                className={`text-[10px] font-mono ${statusBadge[ev.status] || "badge badge-default"}`}
                style={{ minWidth: 48, textAlign: "center" }}
              >
                {ev.status}
              </span>
              <span className="mono text-[11px] flex-1 truncate" style={{ color: "var(--ink-subtle)" }}>
                {ev.messageType.replace(/_/g, " ")}
              </span>
              <span className="mono text-[10px]" style={{ color: "var(--ink-tertiary)" }}>
                {new Date(ev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          ))}
          {agentEvents.length > 8 && (
            <p className="mono text-[10px] pt-1" style={{ color: "var(--ink-tertiary)" }}>
              +{agentEvents.length - 8} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
