import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://snake-game.example.com";

export const metadata: Metadata = {
  title: {
    default: "Snake Game",
    template: "%s | Snake Game",
  },
  description: "A classic Snake game built with React and Next.js. Use arrow keys or swipe to guide the snake. How long can you survive?",
  metadataBase: new URL(BASE_URL),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Snake Game",
    title: "Snake Game",
    description: "A classic Snake game built with React and Next.js. Use arrow keys or swipe to guide the snake. How long can you survive?",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Snake Game — a glowing green snake chasing a red apple on a dark grid",
        type: "image/svg+xml",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Snake Game",
    description: "A classic Snake game built with React and Next.js. Use arrow keys or swipe to guide the snake. How long can you survive?",
    images: ["/og-image.svg"],
  },
};

/**
 * Viewport is exported separately per Next.js 14+ recommendation.
 * This prevents the "viewport" metadata warning and keeps the
 * theme-color / mobile scaling configuration in one place.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",          // respects iPhone notch / safe-area
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#030712" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 antialiased`}>
        {children}
      </body>
    </html>
  );
}
