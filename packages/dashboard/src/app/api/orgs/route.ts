import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Octokit } from "octokit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const octokit = new Octokit({ auth: session.accessToken });

  try {
    const { data: orgs } = await octokit.rest.orgs.listForAuthenticatedUser();
    const { data: user } = await octokit.rest.users.getAuthenticated();

    // Include user's personal account + their orgs
    const options = [
      {
        login: user.login,
        name: user.name || user.login,
        avatar_url: user.avatar_url,
        type: "user" as const,
      },
      ...orgs.map((org) => ({
        login: org.login,
        name: org.login,
        avatar_url: org.avatar_url,
        type: "org" as const,
      })),
    ];

    return NextResponse.json(options);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
