"use client";

import { useState } from "react";

type Props = {
  onSubmit: (title: string, description: string) => Promise<boolean>;
  onRunDemo: () => void;
  demoRunning: boolean;
  demoStatus: string | null;
};

export function FeatureRequestForm({ onSubmit, onRunDemo, demoRunning, demoStatus }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setResult(null);
    const ok = await onSubmit(title, description);
    setResult(ok ? "Feature submitted successfully!" : "Failed to submit");
    if (ok) {
      setTitle("");
      setDescription("");
    }
    setSubmitting(false);
    setTimeout(() => setResult(null), 3000);
  };

  return (
    <div className="glass rounded-xl p-6 glow-white animate-slide-up">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Feature request form */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💡</span>
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Request a Feature</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add Rate Limiting"
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              disabled={submitting}
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              className="flex-[2] px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
            >
              {submitting ? "Submitting..." : "Submit →"}
            </button>
          </div>
          {result && (
            <p className={`mt-2 text-xs ${result.includes("successfully") ? "text-green-400" : "text-red-400"}`}>
              {result}
            </p>
          )}
        </form>

        {/* Divider */}
        <div className="hidden sm:flex items-center">
          <div className="w-px h-12 bg-white/10" />
        </div>
        <div className="flex sm:hidden items-center">
          <div className="h-px w-full bg-white/10" />
        </div>

        {/* Demo control */}
        <div className="sm:w-48 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎮</span>
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Demo</h2>
          </div>
          <button
            onClick={onRunDemo}
            disabled={demoRunning}
            className="w-full px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {demoRunning ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-glow" />
                Running...
              </>
            ) : (
              "▶ Run Full Demo"
            )}
          </button>
          {demoStatus && (
            <p className="mt-1.5 text-xs text-zinc-500 text-center">{demoStatus}</p>
          )}
        </div>
      </div>
    </div>
  );
}
