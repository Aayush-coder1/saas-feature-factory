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

export function LiveFeed({ events }: Props) {
  return (
    <div className="space-y-1 max-h-64 overflow-y-auto text-xs font-mono">
      {events.map((e, i) => (
        <div key={i} className="flex gap-2 py-1 border-b border-border/30">
          <span className={agentColors[e.agentId] || "text-zinc-400 shrink-0 w-16 truncate"}>
            {e.agentId.replace("-agent", "")}
          </span>
          <span className="text-zinc-500 shrink-0 w-20 truncate">{e.messageType}</span>
          <span className="text-zinc-600 truncate">{e.featureId.slice(0, 24)}</span>
          <span className="text-zinc-700 ml-auto shrink-0">
            {new Date(e.createdAt).toLocaleTimeString()}
          </span>
        </div>
      ))}
      {events.length === 0 && (
        <p className="text-zinc-600 italic">No events yet. Run the demo pipeline!</p>
      )}
    </div>
  );
}
