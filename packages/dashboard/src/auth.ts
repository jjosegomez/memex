import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

const config: NextAuthConfig = {
  providers: [
    GitHub({
      authorization: {
        params: {
          // read:org to list user's orgs, read:user for profile, repo for PR creation
          scope: "read:org read:user repo",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Always allow login and onboard pages
      if (pathname === "/login") return true;
      if (pathname === "/onboard") return isLoggedIn; // must be logged in but no org needed

      return isLoggedIn;
    },
    async jwt({ token, account, profile, trigger, session }) {
      // account + profile are only available on initial sign-in
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.login = (profile as { login?: string }).login;
      }
      // Allow updating org via session update (from onboard page)
      if (trigger === "update" && session?.org) {
        token.org = session.org as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.login = token.login as string;
      if (token.org) {
        (session as unknown as { org: string }).org = token.org as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(config);
