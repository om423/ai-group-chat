import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400","500","600","700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Chat Platform",
  description: "Collaborative chat with agents and Cedar-OS tools",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          // Theme + layout
          "min-h-screen bg-background text-foreground antialiased",
          // Sensible defaults for the whole app
          "selection:bg-accent/40 selection:text-foreground",
        ].join(" ")}
      >
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}