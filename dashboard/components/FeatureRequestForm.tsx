"use client";

import { useState, useCallback, useRef } from "react";

type Props = {
  onSubmit: (title: string, description: string) => Promise<boolean>;
  onRunDemo: () => void;
  demoRunning: boolean;
  demoStatus: string | null;
};

const suggestions = [
  { title: "Add Rate Limiting", desc: "Rate limit the API to 100 req/min per user" },
  { title: "Add Webhook Support", desc: "Webhook notifications on task create/update" },
  { title: "Add Search", desc: "Full-text search across all tasks and fields" },
];

export function FeatureRequestForm({ onSubmit, onRunDemo, demoRunning, demoStatus }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      setSubmitting(true);
      setResult(null);
      const ok = await onSubmit(title, description);
      setResult({ ok, msg: ok ? "Feature submitted successfully!" : "Failed to submit" });
      if (ok) {
        setTitle("");
        setDescription("");
      }
      setSubmitting(false);
      setTimeout(() => setResult(null), 3000);
    },
    [title, description, onSubmit]
  );

  const applySuggestion = useCallback((s: { title: string; desc: string }) => {
    setTitle(s.title);
    setDescription(s.desc);
    titleRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  return (
    <div className="card animate-slide-up">
      <div className="flex flex-col sm:flex-row gap-6">
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-subtle)" }}>
              Request a Feature
            </span>
            <kbd className="mono text-[9px] px-1 py-0.5 rounded" style={{ background: "var(--surface-2)", color: "var(--ink-tertiary)", border: "1px solid var(--hairline)" }}>
              {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}+Enter
            </kbd>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Add Rate Limiting"
              className="input-base flex-1"
              disabled={submitting}
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Brief description (optional)"
              className="input-base flex-[2]"
              disabled={submitting}
            />
            <button type="submit" disabled={submitting || !title.trim()} className="btn-primary shrink-0">
              {submitting ? "Submitting..." : "Submit →"}
            </button>
          </div>

          {result && (
            <p
              className="mt-2 text-xs animate-fade-in"
              style={{ color: result.ok ? "var(--success)" : "var(--error)" }}
            >
              {result.msg}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="text-[10px] font-mono px-2 py-0.5 rounded-full transition-all focus-ring"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--ink-subtle)",
                  border: "1px solid var(--hairline)",
                }}
                onClick={() => applySuggestion(s)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--hairline-strong)";
                  (e.currentTarget as HTMLElement).style.color = "var(--ink-muted)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--hairline)";
                  (e.currentTarget as HTMLElement).style.color = "var(--ink-subtle)";
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        </form>

        <div className="hidden sm:flex items-center">
          <div className="w-px h-12" style={{ background: "var(--hairline)" }} />
        </div>
        <div className="flex sm:hidden items-center">
          <div className="h-px w-full" style={{ background: "var(--hairline)" }} />
        </div>

        <div className="sm:w-48 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-subtle)" }}>
              Demo
            </span>
            <kbd className="mono text-[9px] px-1 py-0.5 rounded hidden sm:inline" style={{ background: "var(--surface-2)", color: "var(--ink-tertiary)", border: "1px solid var(--hairline)" }}>
              R
            </kbd>
          </div>
          <button
            onClick={onRunDemo}
            disabled={demoRunning}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {demoRunning ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: "#fff" }} />
                Running...
              </>
            ) : (
              "▶ Run Full Demo"
            )}
          </button>
          {demoStatus && (
            <p className="mt-1.5 text-xs text-center animate-fade-in" style={{ color: "var(--ink-subtle)" }}>
              {demoStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
