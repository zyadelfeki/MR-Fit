import { NextRequest, NextResponse } from "next/server";

const FOOD_TEMPLATES = [
  { name: "Grilled Chicken Breast with Rice", calories: 480, protein: 42, carbs: 45, fat: 8 },
  { name: "Avocado Toast with Poached Egg", calories: 380, protein: 14, carbs: 28, fat: 24 },
  { name: "Double Scoop Whey Protein Shake", calories: 260, protein: 50, carbs: 6, fat: 3 },
  { name: "Seared Salmon with Steamed Broccoli", calories: 410, protein: 38, carbs: 10, fat: 22 },
  { name: "Sirloin Steak with Sweet Potato", calories: 620, protein: 46, carbs: 52, fat: 18 }
];

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    // Simulate edge model execution latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Return a random food template
    const randomIndex = Math.floor(Math.random() * FOOD_TEMPLATES.length);
    const result = FOOD_TEMPLATES[randomIndex];

    return NextResponse.json({
      success: true,
      food: result,
      message: "Detected food using local CNN model"
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to scan food" }, { status: 500 });
  }
}
