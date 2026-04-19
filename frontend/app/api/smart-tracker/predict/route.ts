import { NextRequest, NextResponse } from "next/server";

const SMART_TRACKER_URL = process.env.SMART_TRACKER_URL ?? "http://localhost:8000";

// Smart Tracker /predict expects:
// {
//   accelerometer_x: number[],
//   accelerometer_y: number[],
//   accelerometer_z: number[],
//   gyroscope_x: number[],
//   gyroscope_y: number[],
//   gyroscope_z: number[],
//   set_id?: number,
//   label?: string
// }
// Returns: { exercise: string, confidence: number, probabilities: Record<string, number> }

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await fetch(`${SMART_TRACKER_URL}/predict`, {
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

export async function HEAD() {
    return new Response(null, { status: 200 });
}
