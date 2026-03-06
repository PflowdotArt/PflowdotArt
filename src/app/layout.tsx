import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PromptFlow - AI Generation Tracker",
  description: "Track, manage, and evolve your ComfyUI and AI prompts over time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
