import { NextRequest, NextResponse } from "next/server";

const SMART_TRACKER_URL = process.env.SMART_TRACKER_URL ?? "http://localhost:8000";

// Smart Tracker /count-reps expects the same sensor window as /predict plus:
// ?exercise=<slug>
// Returns: { exercise: string, reps_predicted: number, message: string }

async function isHealthy() {
    const res = await fetch(`${SMART_TRACKER_URL}/health`, { method: "GET", cache: "no-store" });
    return res.ok;
}

export async function HEAD() {
    try {
        return new NextResponse(null, { status: (await isHealthy()) ? 204 : 503 });
    } catch {
        return new NextResponse(null, { status: 503 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const targetUrl = new URL(`${SMART_TRACKER_URL}/count-reps`);
        const incomingUrl = new URL(req.url);
        incomingUrl.searchParams.forEach((value, key) => {
            targetUrl.searchParams.set(key, value);
        });

        const res = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Smart Tracker unavailable" }, { status: 502 });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Failed to reach Smart Tracker service" }, { status: 503 });
    }
}
