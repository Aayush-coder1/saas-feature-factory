"use client";

type Event = {
  agentId: string;
  messageType: string;
  featureId: string;
  createdAt: string;
};

type Props = { events: Event[] };

const agentMeta: Record<string, { label: string; color: string; icon: string }> = {
  "spec-agent": { label: "Spec", color: "bg-blue-500", icon: "🔍" },
  "code-gen-agent": { label: "CodeGen", color: "bg-purple-500", icon: "⚡" },
  "qa-agent": { label: "QA", color: "bg-green-500", icon: "🧪" },
  "docs-agent": { label: "Docs", color: "bg-amber-500", icon: "📝" },
  "deploy-agent": { label: "Deploy", color: "bg-red-500", icon: "🚀" },
};

const stepOrder = ["blueprint", "code_patch", "docs_updated", "qa_report", "deployment_result"];

export function PipelineTimeline({ events }: Props) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-3xl mb-2 opacity-30">⚡</div>
        <p className="text-xs text-zinc-600 italic">Waiting for pipeline activity...</p>
        <p className="text-[10px] text-zinc-700 mt-1">Submit a feature or run the demo to see agents in action</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((e, i) => {
        const meta = agentMeta[e.agentId];
        const label = meta?.label || e.agentId;
        const dotColor = meta?.color || "bg-zinc-600";
        const step = stepOrder.indexOf(e.messageType);
        const isActive = step >= 0;

        return (
          <div key={i} className="flex gap-3 py-2.5 group animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${isActive ? `${dotColor} ring-2 ring-white/10` : "bg-zinc-700"} transition-all group-hover:scale-110`} />
              {i < sorted.length - 1 && (
                <div className={`w-px flex-1 min-h-[20px] ${isActive ? "bg-white/5" : "bg-white/[0.02]"}`} />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">{meta?.icon || "•"}</span>
                <span className="text-xs font-medium text-zinc-300">{label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-green-500/10 text-green-400" : "bg-zinc-800 text-zinc-600"
                }`}>
                  {e.messageType.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-[10px] text-zinc-700 mt-0.5">
                {new Date(e.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
