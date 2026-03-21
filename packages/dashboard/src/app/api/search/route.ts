import { NextResponse } from "next/server";
import { searchProjects } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  if (query.length < 2) {
    return NextResponse.json([]);
  }
  const results = await searchProjects(query);
  return NextResponse.json(results);
}
