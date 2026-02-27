"use client";

import { useState } from "react";

export function EmailCapture() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-xl text-center">
        {/* Decorative border */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-10 sm:p-14">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Cloud sync is coming
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            E2E encrypted cloud sync so your memories travel across machines.
            Get notified when it launches.
          </p>

          {submitted ? (
            <div className="mt-8 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <p className="text-sm text-green-400">
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
                const form = e.target as HTMLFormElement;
                const data = new FormData(form);
                fetch("/", {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
                })
                  .then(() => setSubmitted(true))
                  .catch(() => setSubmitted(true)); // Show success even if fetch fails (SSG)
              }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <input type="hidden" name="form-name" value="waitlist" />
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-purple-600"
              >
                Notify me
              </button>
            </form>
          )}

          <p className="mt-4 text-xs text-gray-600">
            No spam. One email when it&apos;s ready.
          </p>
        </div>
      </div>
    </section>
  );
}
