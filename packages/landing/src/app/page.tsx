import { Hero } from "../../components/hero";
import { Problem } from "../../components/problem";
import { HowItWorks } from "../../components/how-it-works";
import { Security } from "../../components/security";
import { Features } from "../../components/features";
import { Install } from "../../components/install";
import { EmailCapture } from "../../components/email-capture";
import { Footer } from "../../components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Problem />
      <HowItWorks />
      <Security />
      <Features />
      <Install />
      <EmailCapture />
      <Footer />
    </main>
  );
}
