import type { Metadata } from "next";
<<<<<<< HEAD
import "./globals.css";
=======
>>>>>>> c9822da (QA: add Next.js 15 scaffold files and tests for ticket b0629528)

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
