import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sql } from "@/lib/db";
import type { NextAuthConfig } from "next-auth";

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const config: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials.password) return null;

        const rows = (await (sql as any)`
          SELECT id, email, password_hash, role, member_id, is_active
          FROM users
          WHERE email = ${credentials.email}
          LIMIT 1
        `) as {
          id: number;
          email: string;
          password_hash: string;
          role: string;
          member_id: number | null;
          is_active: boolean;
        }[];

        const [user] = rows;

        if (!user || !user.is_active) return null;

        const hashedInput = await hashPassword(credentials.password as string);
        if (hashedInput !== user.password_hash) return null;

        return {
          id: String(user.id),
          email: user.email,
          role: user.role,
          memberId: user.member_id,
        };
      },
    }),
  ],
  callbacks: {
    // ✅ Protects all routes in middleware matcher
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
      const isAdmin = role === "ADMIN";
      const isResident = role === "RESIDENT";

      const isAdminRoute =
        nextUrl.pathname === "/" ||
        nextUrl.pathname.startsWith("/members") ||
        nextUrl.pathname.startsWith("/units") ||
        nextUrl.pathname.startsWith("/users") ||
        nextUrl.pathname.startsWith("/billing") ||
        nextUrl.pathname.startsWith("/payments") ||
        nextUrl.pathname.startsWith("/expenses") ||
        nextUrl.pathname.startsWith("/complaints") ||
        nextUrl.pathname.startsWith("/sos") ||
        nextUrl.pathname.startsWith("/notices") ||
        nextUrl.pathname.startsWith("/polls") ||
        nextUrl.pathname.startsWith("/vehicles") ||
        nextUrl.pathname.startsWith("/ownerships") ||
        nextUrl.pathname.startsWith("/reports");

      const isResidentRoute = nextUrl.pathname.startsWith("/resident");

      // Not logged in → redirect to login
      if (!isLoggedIn) return false;

      // Resident trying to access admin routes → redirect to resident
      if (isAdminRoute && isResident) {
        return Response.redirect(new URL("/resident", nextUrl));
      }

      // Admin trying to access resident routes → redirect to admin
      if (isResidentRoute && isAdmin) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.memberId = (user as any).memberId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).memberId = token.memberId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
