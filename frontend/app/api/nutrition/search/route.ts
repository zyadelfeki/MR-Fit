import { NextResponse } from "next/server";
import { searchFoods } from "@/lib/openFoodFacts";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q) {
        return NextResponse.json({ foods: [] });
    }

    try {
        const foods = await searchFoods(q);
        return NextResponse.json({ foods });
    } catch (error) {
        console.error("GET /api/nutrition/search error:", error);
        return NextResponse.json({ foods: [], error: "Search unavailable" });
    }
}
