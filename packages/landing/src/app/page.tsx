import { Hero } from "../../components/hero";
import { BeforeAfter } from "../../components/before-after";
import { HowItWorks } from "../../components/how-it-works";
import { CrossTool } from "../../components/cross-tool";
import { Features } from "../../components/features";
import { Security } from "../../components/security";
import { Comparison } from "../../components/comparison";
import { EmailCapture } from "../../components/email-capture";
import { Footer } from "../../components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />

      {/* Credibility strip */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 bg-[#1c1b1b] px-6 py-6 text-sm text-[#c6c6c6]">
        <span className="font-[family-name:var(--font-space-grotesk)] uppercase tracking-widest text-xs text-[#919191]">Works with any MCP tool</span>
        <span aria-hidden="true">&middot;</span>
        <span className="font-[family-name:var(--font-space-grotesk)] uppercase tracking-widest text-xs text-[#919191]">Claude Code, Cursor, Codex + more</span>
        <span aria-hidden="true">&middot;</span>
        <span className="font-[family-name:var(--font-space-grotesk)] uppercase tracking-widest text-xs text-[#919191]">AES-256-GCM encrypted</span>
        <span aria-hidden="true">&middot;</span>
        <span className="font-[family-name:var(--font-space-grotesk)] uppercase tracking-widest text-xs text-[#919191]">MIT licensed</span>
        <span aria-hidden="true">&middot;</span>
        <span className="font-[family-name:var(--font-space-grotesk)] uppercase tracking-widest text-xs text-[#919191]">Zero cloud dependencies</span>
      </div>

      <BeforeAfter />
      <HowItWorks />
      <CrossTool />
      <Features />
      <Security />
      <Comparison />
      <EmailCapture />
      <Footer />
    </main>
  );
}
