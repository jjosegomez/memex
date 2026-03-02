import { Hero } from "../../components/hero";
import { Problem } from "../../components/problem";
import { HowItWorks } from "../../components/how-it-works";
import { Security } from "../../components/security";
import { Features } from "../../components/features";
import { Comparison } from "../../components/comparison";
import { Install } from "../../components/install";
import { EmailCapture } from "../../components/email-capture";
import { Footer } from "../../components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />

      {/* Credibility strip */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-6 pb-12 text-sm text-gray-500">
        <span>AES-256-GCM encrypted</span>
        <span aria-hidden="true">&middot;</span>
        <span>SQLite + FTS5</span>
        <span aria-hidden="true">&middot;</span>
        <span>4 MCP tools</span>
        <span aria-hidden="true">&middot;</span>
        <span>MIT licensed</span>
        <span aria-hidden="true">&middot;</span>
        <span>Zero cloud dependencies</span>
      </div>

      <Problem />
      <HowItWorks />
      <Security />
      <Features />
      <Comparison />
      <Install />
      <EmailCapture />
      <Footer />
    </main>
  );
}
