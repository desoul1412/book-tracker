import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snake Game",
  description: "A classic Snake game built with Next.js 15",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
