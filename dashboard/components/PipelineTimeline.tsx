type Event = {
  agentId: string;
  messageType: string;
  featureId: string;
  createdAt: string;
};

type Props = { events: Event[] };

const agentLabels: Record<string, string> = {
  "spec-agent": "Spec",
  "code-gen-agent": "CodeGen",
  "qa-agent": "QA",
  "docs-agent": "Docs",
  "deploy-agent": "Deploy",
};

const stepOrder = ["blueprint", "code_patch", "docs_updated", "qa_report", "deployment_result"];

export function PipelineTimeline({ events }: Props) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((e, i) => {
        const label = agentLabels[e.agentId] || e.agentId;
        const step = stepOrder.indexOf(e.messageType);
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                step >= 0 ? "bg-green-500" : "bg-zinc-600"
              }`}
            />
            <span className="text-xs font-medium text-zinc-300 w-14">{label}</span>
            <span className="text-xs text-zinc-500 capitalize truncate">
              {e.messageType.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-zinc-600 ml-auto">
              {new Date(e.createdAt).toLocaleTimeString()}
            </span>
          </div>
        );
      })}
      {sorted.length === 0 && (
        <p className="text-xs text-zinc-600 italic">Waiting for pipeline activity...</p>
      )}
    </div>
  );
}
