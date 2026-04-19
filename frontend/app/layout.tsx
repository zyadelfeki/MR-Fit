import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: { default: "MR.FIT", template: "%s | MR.FIT" },
  description:
    "Your AI-powered fitness companion. Track workouts, nutrition, and get personalized coaching.",
  icons: { icon: "/logo.jpg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
