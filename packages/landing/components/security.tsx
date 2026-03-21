const keyPoints = [
  {
    label: "AES-256-GCM",
    description: "Authenticated encryption with unique IVs per memory. PBKDF2 key derivation.",
  },
  {
    label: "Local-first",
    description: "Your encryption key never leaves your machine. Data stays on disk.",
  },
  {
    label: "No data leaves your machine",
    description: "No server, no cloud, no third party. Plaintext stays local, always.",
  },
  {
    label: "Open source",
    description: "MIT licensed. Read every line of the encryption code yourself.",
  },
];

export function Security() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — explanation */}
          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold uppercase tracking-widest text-[#919191]">
              Security
            </h2>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#e5e2e1] sm:text-4xl">
              We can&apos;t read your data.
              <br />
              <span className="text-[#919191]">No one can.</span>
            </p>
            <p className="mt-6 text-[#c6c6c6] leading-7">
              Every memory is encrypted with AES-256-GCM before it touches disk.
              Your encryption key is derived locally and never transmitted.
              Even when cloud sync ships, only encrypted blobs leave your machine.
            </p>

            {/* Key points */}
            <div className="mt-10 grid grid-cols-2 gap-6">
              {keyPoints.map((point) => (
                <div key={point.label}>
                  <p className="text-sm font-semibold text-[#e5e2e1]">
                    {point.label}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#c6c6c6]">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — encryption flow diagram */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm space-y-4">
              {/* Flow step 1 */}
              <div className="rounded-md bg-[#1c1b1b] p-5 text-center">
                <p className="font-[family-name:var(--font-space-grotesk)] text-xs font-medium uppercase tracking-wider text-[#919191]">
                  Your Agent
                </p>
                <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-sm text-[#c6c6c6]">
                  &quot;Auth uses Clerk with JWT...&quot;
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-6 w-px bg-[#22c55e]/40" />
                  <svg className="h-4 w-4 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              {/* Flow step 2 */}
              <div className="rounded-md border border-[#22c55e]/20 bg-[#1c1b1b] p-5 text-center">
                <p className="font-[family-name:var(--font-space-grotesk)] text-xs font-medium uppercase tracking-wider text-[#22c55e]">
                  AES-256-GCM Encryption
                </p>
                <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-xs text-[#919191]">
                  key = PBKDF2(passphrase) | random
                </p>
                <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-xs text-[#919191]">
                  iv = crypto.randomBytes(12)
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-6 w-px bg-[#22c55e]/40" />
                  <svg className="h-4 w-4 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              {/* Flow step 3 */}
              <div className="rounded-md bg-[#1c1b1b] p-5 text-center">
                <p className="font-[family-name:var(--font-space-grotesk)] text-xs font-medium uppercase tracking-wider text-[#919191]">
                  Stored on Disk
                </p>
                <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-xs text-[#22c55e]/70 break-all">
                  a4f8c2...e91b (encrypted blob)
                </p>
                <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-xs text-[#919191]/60">
                  + iv + authTag
                </p>
              </div>

              {/* Footer note */}
              <p className="text-center text-xs text-[#919191]/60">
                Plaintext never leaves your machine
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
