import { signIn } from "@/auth";
import { Github } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 px-6">
        {/* Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Memex
          </h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-2">
            Knowledge Layer
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-low rounded-lg border border-border p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground">
              Sign in to your dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your GitHub to scan project knowledge
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              <Github className="h-4 w-4" />
              Sign in with GitHub
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 font-mono">
          Your GitHub token is stored in an encrypted session.
          <br />
          We never store your code.
        </p>
      </div>
    </div>
  );
}
