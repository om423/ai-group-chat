import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import { CedarCopilot } from "cedar-os";
import "./globals.css";

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter', 
  display: 'swap' 
});

export const metadata: Metadata = {
  title: "AI Chat Platform",
  description: "Collaborative chat with agents and Cedar-OS tools",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} font-sans h-full`}>
      <body className="h-full">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}