import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Inter, Barlow_Condensed } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow-condensed",
});

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
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable} dark`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress browser extension injected errors crashing the dev overlay
              window.addEventListener('error', function(event) {
                if (event.message && (
                  event.message.includes('ethereum') || 
                  event.message.includes('Cannot redefine property') ||
                  event.message.includes('evmAsk')
                )) {
                  event.stopImmediatePropagation();
                  event.preventDefault();
                }
              });
              
              // Force dark theme class
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark) || true) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#0D0D0D] text-white antialiased font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

