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
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-white/5 px-6 py-6 text-sm text-gray-400">
        <span>Works with any MCP tool</span>
        <span aria-hidden="true">&middot;</span>
        <span>Claude Code, Cursor, Codex + more</span>
        <span aria-hidden="true">&middot;</span>
        <span>AES-256-GCM encrypted</span>
        <span aria-hidden="true">&middot;</span>
        <span>MIT licensed</span>
        <span aria-hidden="true">&middot;</span>
        <span>Zero cloud dependencies</span>
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
