const keyPoints = [
  {
    label: "AES-256-GCM",
    description: "Military-grade authenticated encryption with unique IVs per memory",
  },
  {
    label: "Local-first",
    description: "Your encryption key never leaves your machine. Data stays on disk.",
  },
  {
    label: "Zero-knowledge",
    description: "No server, no cloud, no third party can access your data.",
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
            <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Security
            </h2>
            <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              We can&apos;t read your data.
              <br />
              <span className="text-gray-500">No one can.</span>
            </p>
            <p className="mt-6 text-gray-400 leading-7">
              Every memory is encrypted with AES-256-GCM before it touches disk.
              Your encryption key is derived locally and never transmitted.
              Even when cloud sync ships, only encrypted blobs leave your machine.
            </p>

            {/* Key points */}
            <div className="mt-10 grid grid-cols-2 gap-6">
              {keyPoints.map((point) => (
                <div key={point.label}>
                  <p className="text-sm font-semibold text-white">
                    {point.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
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
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Your Agent
                </p>
                <p className="mt-2 font-mono text-sm text-gray-300">
                  &quot;Auth uses Clerk with JWT...&quot;
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-6 w-px bg-gradient-to-b from-blue-500 to-purple-500" />
                  <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              {/* Flow step 2 */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
                  AES-256-GCM Encryption
                </p>
                <p className="mt-2 font-mono text-xs text-gray-500">
                  key = PBKDF2(passphrase) | random
                </p>
                <p className="mt-1 font-mono text-xs text-gray-500">
                  iv = crypto.randomBytes(12)
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-6 w-px bg-gradient-to-b from-purple-500 to-blue-500" />
                  <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              {/* Flow step 3 */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stored on Disk
                </p>
                <p className="mt-2 font-mono text-xs text-green-400/70 break-all">
                  a4f8c2...e91b (encrypted blob)
                </p>
                <p className="mt-1 font-mono text-xs text-gray-600">
                  + iv + authTag
                </p>
              </div>

              {/* Footer note */}
              <p className="text-center text-xs text-gray-600">
                Plaintext never leaves your machine
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
