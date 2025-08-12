import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LSAT Coach",
  description: "LSAT practice drills + mentor chat + flashcards",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
