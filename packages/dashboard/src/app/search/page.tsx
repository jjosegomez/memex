"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  project: string;
  file: string;
  matches: { line: number; text: string }[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const totalMatches = results.reduce(
    (sum, r) => sum + r.matches.length,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Search</span>
      </nav>

      <h1 className="text-2xl font-semibold mb-6">
        Search Knowledge Base
      </h1>

      <Input
        type="text"
        placeholder="Search across all knowledge files..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6 text-base h-12"
        autoFocus
      />

      {loading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {!loading && query.length >= 2 && (
        <p className="text-sm text-muted-foreground mb-4">
          {totalMatches} match{totalMatches !== 1 ? "es" : ""} in{" "}
          {results.length} file{results.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="space-y-4">
        {results.map((result, i) => (
          <Link
            key={`${result.project}-${result.file}-${i}`}
            href={`/projects/${encodeURIComponent(result.project)}#${result.file}`}
          >
            <Card className="hover:border-foreground/20 transition-colors cursor-pointer mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {result.project}
                  </span>
                  <span className="text-muted-foreground/50">/</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {result.file}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.matches.map((match, j) => (
                    <div
                      key={j}
                      className="text-sm font-mono flex gap-3"
                    >
                      <span className="text-muted-foreground/50 select-none w-8 text-right shrink-0">
                        {match.line}
                      </span>
                      <HighlightedText
                        text={match.text}
                        query={query}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query) return <span>{text}</span>;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.split(regex);

  return (
    <span className="truncate">
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-500/30 text-foreground rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
