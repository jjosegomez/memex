"use client";

import { useState } from "react";
import { Sparkles, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { generateClaudeMd } from "@/app/actions/generate-claude-md";

interface Props {
  owner: string;
  repo: string;
}

export function GenerateClaudeMdButton({ owner, repo }: Props) {
  const [state, setState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setState("loading");
    const result = await generateClaudeMd(owner, repo);
    if (result.success && result.prUrl) {
      setState("success");
      setPrUrl(result.prUrl);
    } else {
      setState("error");
      setError(result.error || "Unknown error");
    }
  }

  if (state === "success" && prUrl) {
    return (
      <a
        href={prUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        PR Created — Review on GitHub
      </a>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={state === "loading"}
      className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors disabled:opacity-50"
    >
      {state === "loading" ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Generating CLAUDE.md...
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          Generate CLAUDE.md
        </>
      )}
    </button>
  );
}
