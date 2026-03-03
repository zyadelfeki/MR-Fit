import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MR-Fit", template: "%s | MR-Fit" },
  description: "AI-powered fitness companion — workouts, nutrition, and personalized coaching",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
