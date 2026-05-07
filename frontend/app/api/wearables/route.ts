// Thin Next.js proxy so the frontend doesn't call localhost:8000 directly in production
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const AI_URL = process.env.AI_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${AI_URL}/wearables/latest/${session.user.id}`);
  const data = await res.json();
  return NextResponse.json(data);
}
