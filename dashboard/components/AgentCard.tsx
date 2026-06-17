"use client";

type Props = {
  agent: { id: string; label: string; color: string; icon: string };
  event?: { status: string; messageType: string; createdAt: string } | null;
};

const statusColors: Record<string, string> = {
  done: "bg-green-500",
  deployed: "bg-green-500",
  working: "bg-blue-500",
  failed: "bg-red-500",
  idle: "bg-zinc-600",
};

const glowColors: Record<string, string> = {
  blue: "glow-blue",
  purple: "glow-purple",
  green: "glow-green",
  amber: "glow-amber",
  red: "glow-red",
};

const borderActive: Record<string, string> = {
  blue: "border-blue-500/30",
  purple: "border-purple-500/30",
  green: "border-green-500/30",
  amber: "border-amber-500/30",
  red: "border-red-500/30",
};

const borderIdle = "border-white/5";

export function AgentCard({ agent, event }: Props) {
  const status = event?.status || "idle";
  const dotColor = statusColors[status] || statusColors.idle;
  const isActive = status !== "idle";
  const borderClass = isActive ? borderActive[agent.color] || borderIdle : borderIdle;
  const glowClass = isActive ? glowColors[agent.color] || "" : "";

  return (
    <div className={`glass-hover rounded-xl p-4 ${borderClass} ${glowClass} transition-all duration-300`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <span className="text-lg">{agent.icon}</span>
          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${dotColor} ${isActive ? "animate-pulse-glow" : ""}`} />
        </div>
        <div>
          <span className="text-sm font-medium text-zinc-200">{agent.label}</span>
          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isActive ? "text-zinc-400" : "text-zinc-600"}`}>
            {status}
          </p>
        </div>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            status === "done" || status === "deployed" ? "bg-green-500 w-full" :
            status === "failed" ? "bg-red-500 w-3/4" :
            isActive ? "bg-blue-500 w-2/3 animate-pulse-glow" : "w-0"
          }`}
        />
      </div>
      {event && (
        <p className="text-[10px] text-zinc-600 mt-2 truncate">
          {event.messageType.replace(/_/g, " ")}
        </p>
      )}
    </div>
  );
}
