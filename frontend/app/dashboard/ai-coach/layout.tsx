import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Coach | MR-Fit", description: "Your personalized fitness assistant" };

export default function AICoachLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
