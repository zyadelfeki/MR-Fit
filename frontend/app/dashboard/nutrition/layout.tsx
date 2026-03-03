import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nutrition | MR-Fit", description: "Track your daily nutrition and macros" };

export default function NutritionLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
