"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, User, Loader2 } from "lucide-react";

interface OrgOption {
  login: string;
  name: string;
  avatar_url: string;
  type: "user" | "org";
}

export default function OnboardPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orgs")
      .then((res) => res.json())
      .then((data) => {
        setOrgs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function selectOrg(login: string) {
    setSelecting(login);
    // Update the JWT with the selected org
    await update({ org: login });
    router.push("/");
  }

  // If already has an org, redirect to dashboard
  if (session && (session as unknown as { org?: string }).org) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Memex
          </h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-2">
            Connect Your Organization
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-low rounded-lg border border-border p-8 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-foreground">
              Select a GitHub organization
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              We&apos;ll scan its repos for knowledge files (CLAUDE.md, CONTEXT.md, PATTERNS.md)
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : orgs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No organizations found. Make sure you granted org access during login.
            </p>
          ) : (
            <div className="space-y-2">
              {orgs.map((org) => (
                <button
                  key={org.login}
                  onClick={() => selectOrg(org.login)}
                  disabled={selecting !== null}
                  className="w-full flex items-center gap-3 rounded-md border border-border p-3 text-left hover:bg-surface-high hover:border-muted-foreground/30 transition-colors disabled:opacity-50"
                >
                  {org.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={org.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-surface-highest flex items-center justify-center shrink-0">
                      {org.type === "org" ? (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {org.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {org.type === "org" ? "Organization" : "Personal account"}
                    </p>
                  </div>
                  {selecting === org.login && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
