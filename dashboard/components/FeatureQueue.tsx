"use client";

type Props = { features: string[] };

const allFeatures = [
  { title: "Add CSV Export", icon: "📄" },
  { title: "Add Dark Mode", icon: "🌙" },
  { title: "Add Label Filtering", icon: "🏷️" },
  { title: "Add OTP Auth", icon: "🔐" },
  { title: "Add Pagination", icon: "📑" },
];

export function FeatureQueue({ features }: Props) {
  return (
    <div className="space-y-2">
      {allFeatures.map((f, i) => {
        const completed = features.some((c) => f.title.includes(c) || c.includes(f.title));
        return (
          <div
            key={i}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
              completed
                ? "bg-green-500/5 border border-green-500/20"
                : "bg-white/[0.02] border border-white/5"
            }`}
          >
            {/* Status icon */}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
              completed
                ? "bg-green-500/20 text-green-400"
                : "bg-zinc-800 text-zinc-600"
            }`}>
              {completed ? "✓" : f.icon}
            </div>

            {/* Title */}
            <span className={`text-sm flex-1 transition-all ${
              completed ? "text-zinc-200" : "text-zinc-500"
            }`}>
              {f.title}
            </span>

            {/* Progress bar + status */}
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden hidden sm:block">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    completed ? "bg-green-500 w-full" : "w-0"
                  }`}
                />
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                completed
                  ? "bg-green-500/20 text-green-400"
                  : "bg-zinc-800 text-zinc-600"
              }`}>
                {completed ? "Done" : "Pending"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
