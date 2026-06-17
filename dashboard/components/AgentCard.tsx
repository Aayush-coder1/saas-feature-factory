type Props = {
  agent: { id: string; label: string; color: string };
  event?: { status: string; messageType: string; createdAt: string } | null;
};

const statusColors: Record<string, string> = {
  done: "bg-green-500",
  working: "bg-blue-500 animate-pulse",
  failed: "bg-red-500",
  deployed: "bg-purple-500",
  idle: "bg-zinc-600",
};

const borderColors: Record<string, string> = {
  blue: "border-blue-500/30",
  purple: "border-purple-500/30",
  green: "border-green-500/30",
  amber: "border-amber-500/30",
  red: "border-red-500/30",
};

export function AgentCard({ agent, event }: Props) {
  const status = event?.status || "idle";
  const dotColor = statusColors[status] || statusColors.idle;

  return (
    <div className={`p-3 rounded-lg bg-surface-alt border ${borderColors[agent.color] || "border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-sm font-medium text-white">{agent.label}</span>
      </div>
      <p className="text-xs text-zinc-500 capitalize">{status}</p>
      {event && (
        <p className="text-xs text-zinc-600 mt-1 truncate">
          {event.messageType}
        </p>
      )}
    </div>
  );
}
