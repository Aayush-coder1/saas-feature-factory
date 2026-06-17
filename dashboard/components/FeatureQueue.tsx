type Props = { features: string[] };

const statusMap: Record<string, { label: string; color: string }> = {
  requested: { label: "Requested", color: "bg-zinc-600" },
  blueprint: { label: "Spec'd", color: "bg-blue-500" },
  coded: { label: "Coded", color: "bg-purple-500" },
  tested: { label: "Tested", color: "bg-green-500" },
  deployed: { label: "Deployed", color: "bg-purple-500" },
};

export function FeatureQueue({ features }: Props) {
  const allFeatures = [
    { title: "Add CSV Export", status: "tested" },
    { title: "Add Dark Mode", status: "tested" },
    { title: "Add Label Filtering", status: "tested" },
    { title: "Add OTP Auth", status: "tested" },
    { title: "Add Pagination", status: "tested" },
  ];

  return (
    <div className="space-y-2">
      {allFeatures.map((f, i) => {
        const completed = features.some((c) => f.title.includes(c) || c.includes(f.title));
        const st = completed ? { label: "Completed", color: "bg-green-500" } : statusMap[f.status] || statusMap.requested;
        return (
          <div key={i} className="flex items-center gap-3 p-2 rounded bg-surface-alt border border-border">
            <span className={`w-2 h-2 rounded-full shrink-0 ${st.color}`} />
            <span className="text-sm text-zinc-300 flex-1 truncate">{f.title}</span>
            <span className="text-xs text-zinc-500">{st.label}</span>
          </div>
        );
      })}
    </div>
  );
}
