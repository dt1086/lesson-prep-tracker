import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lesson Prep Tracker",
  description: "Tutoring session prep tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lesson Prep",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#0b0f0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-card-border">
          <nav className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-6">
            <span className="font-semibold text-accent">Lesson Prep</span>
            <Link href="/" className="text-sm text-muted hover:text-foreground">
              Upcoming
            </Link>
            <Link
              href="/students"
              className="text-sm text-muted hover:text-foreground"
            >
              Students
            </Link>
            <Link
              href="/settings"
              className="text-sm text-muted hover:text-foreground"
            >
              Settings
            </Link>
          </nav>
        </header>
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
