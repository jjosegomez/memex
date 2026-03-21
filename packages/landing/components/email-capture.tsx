"use client";

import { useState } from "react";

export function EmailCapture() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyCommand() {
    navigator.clipboard.writeText("npx memex-mcp init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Primary CTA — install now */}
        <div className="rounded-md bg-[#1c1b1b] p-10 text-center sm:p-14">
          <h2 className="text-2xl font-bold tracking-tight text-[#e5e2e1] sm:text-3xl">
            Get started in 30 seconds
          </h2>
          <p className="mt-4 text-sm leading-6 text-[#c6c6c6]">
            One command. Works with any MCP-compatible AI tool.
          </p>
          <button
            onClick={copyCommand}
            className="mt-6 inline-flex items-center gap-3 rounded-md bg-[#22c55e] px-6 py-3.5 font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-[#131313] shadow-[0_0_60px_rgba(34,197,94,0.06)] transition hover:bg-[#6bff8f]"
          >
            <span className="text-[#131313]/60">$</span>
            <span>npx memex-mcp init</span>
            <span className="ml-2 text-xs text-[#131313]/60">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>
        </div>

        {/* Secondary — cloud sync waitlist */}
        <div className="rounded-md bg-[#1c1b1b] p-8 text-center sm:p-10">
          <p className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold uppercase tracking-widest text-[#22c55e]">
            Coming soon
          </p>
          <h3 className="mt-3 text-xl font-bold tracking-tight text-[#e5e2e1]">
            Cloud sync is next
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#c6c6c6]">
            E2E encrypted cloud sync. Your memories travel across machines
            — only encrypted blobs leave your device.
          </p>

          {submitted ? (
            <div className="mt-6 rounded-md bg-[#22c55e]/10 p-4">
              <p className="text-sm text-[#22c55e]">
                You&apos;re on the list. We&apos;ll email you when cloud sync is ready.
              </p>
            </div>
          ) : (
            <form
              name="waitlist"
              method="POST"
              data-netlify="true"
              onSubmit={(e) => {
                e.preventDefault();
                setError(false);
                const form = e.target as HTMLFormElement;
                const data = new FormData(form);
                fetch("/", {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
                })
                  .then(() => setSubmitted(true))
                  .catch(() => setError(true));
              }}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <input type="hidden" name="form-name" value="waitlist" />
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="flex-1 rounded-md bg-[#0e0e0e] px-4 py-3 text-sm text-[#e5e2e1] placeholder-[#919191]/60 outline-none transition focus:ring-1 focus:ring-[#22c55e]/50"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md border border-[#22c55e]/30 bg-[#22c55e]/10 px-6 py-3 text-sm font-semibold text-[#22c55e] transition hover:bg-[#22c55e]/20"
              >
                Join the waitlist
              </button>
            </form>
          )}

          {error && (
            <p className="mt-3 text-xs text-[#ffb4ab]">
              Something went wrong. Please try again.
            </p>
          )}

          <p className="mt-4 text-xs text-[#919191]/60">
            No spam. One email when it&apos;s ready.
          </p>
        </div>
      </div>
    </section>
  );
}
