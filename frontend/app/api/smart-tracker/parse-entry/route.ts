import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const AI_COACH_API_URL = process.env.NEXT_PUBLIC_AI_COACH_API_URL ?? "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { text, prefill_exercise } = body as {
            text?: string;
            prefill_exercise?: string;
        };

        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Text cannot be empty" }, { status: 400 });
        }

        const res = await fetch(`${AI_COACH_API_URL}/parse-entry`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: text.trim(),
                prefill_exercise: prefill_exercise || null,
            }),
        });

        if (!res.ok) {
            const errDetail = await res.text();
            console.error("FastAPI parse-entry error details:", errDetail);
            return NextResponse.json({ error: "Parser microservice returned an error" }, { status: 502 });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("POST /api/smart-tracker/parse-entry error:", err);
        return NextResponse.json({ error: "Failed to connect to parser microservice" }, { status: 503 });
    }
}

export async function HEAD() {
    return new Response(null, { status: 200 });
}
