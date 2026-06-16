import { NextRequest, NextResponse } from "next/server";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_COACH_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const { image, mime_type } = await req.json();
    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${AI_BACKEND_URL}/analyze-food-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: image,
        mime_type: mime_type ?? "image/jpeg",
      }),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      return NextResponse.json(
        { error: `AI backend error: ${errText}` },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();

    // Map Python backend keys -> frontend FoodResult keys
    const food = {
      name: data.food_name ?? "Unknown Food",
      calories: Math.round(data.total_calories ?? 0),
      protein: Math.round((data.protein_g ?? 0) * 10) / 10,
      carbs: Math.round((data.carbs_g ?? 0) * 10) / 10,
      fat: Math.round((data.fat_g ?? 0) * 10) / 10,
      servingSize: data.estimated_weight_g
        ? `${data.estimated_weight_g}g`
        : "1 serving",
    };

    return NextResponse.json({
      success: true,
      food,
      confidence: data.confidence ?? null,
      message: "Food analyzed using AI vision model",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to scan food" },
      { status: 500 }
    );
  }
}
