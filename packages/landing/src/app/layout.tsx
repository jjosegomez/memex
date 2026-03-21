import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://getmemex.dev"),
  title: "Memex — Encrypted AI Memory for Developers",
  description:
    "Persistent, encrypted memory for every AI coding agent you use. One command to install. Works with Claude Code, Cursor, Windsurf, and any MCP tool.",
  openGraph: {
    title: "Memex — Encrypted AI Memory for Developers",
    description:
      "Persistent, encrypted memory for every AI coding agent you use. One command to install. Works with Claude Code, Cursor, Windsurf, and any MCP tool.",
    type: "website",
    siteName: "Memex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memex — Encrypted AI Memory for Developers",
    description:
      "Persistent, encrypted memory for every AI coding agent you use. One command to install.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
