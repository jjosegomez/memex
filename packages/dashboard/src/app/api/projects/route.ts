import { NextResponse } from "next/server";
import { scanProjects, type KnowledgeFile } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await scanProjects();
  // Strip file contents for the list view (keep it lightweight)
  const lightweight = projects.map((p) => ({
    ...p,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    files: p.files.map(({ content: _content, ...rest }: KnowledgeFile) => rest),
  }));
  return NextResponse.json(lightweight);
}
