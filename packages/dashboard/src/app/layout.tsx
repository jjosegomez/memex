import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { Providers } from "@/components/providers";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} dark h-full antialiased`}
    >
      <body className="h-full flex">
        <Providers>
        {/* Sidebar — only show when logged in */}
        {isLoggedIn && (
          <Sidebar
            userName={session.user.name}
            userImage={session.user.image}
            orgName={process.env.NEXT_PUBLIC_ORG_NAME}
          />
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-full overflow-hidden">
          {isLoggedIn && (
            <header className="h-12 shrink-0 flex items-center justify-between px-6 bg-surface">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {process.env.NEXT_PUBLIC_ORG_NAME || "Knowledge Layer"}
              </span>
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt=""
                  className="h-7 w-7 rounded-full"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-surface-high" />
              )}
            </header>
          )}

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        </Providers>
      </body>
    </html>
  );
}
