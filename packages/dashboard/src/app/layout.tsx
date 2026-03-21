import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { User } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memex",
  description: "See what your AI agents know across all projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} dark h-full antialiased`}
    >
      <body className="h-full flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-full overflow-hidden">
          {/* Top bar */}
          <header className="h-12 shrink-0 flex items-center justify-between px-6 bg-surface">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {process.env.NEXT_PUBLIC_ORG_NAME || "Knowledge Layer"}
            </span>
            <div className="h-7 w-7 rounded-full bg-surface-high flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
