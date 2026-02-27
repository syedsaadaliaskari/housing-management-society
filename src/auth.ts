import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { sql } from "@/lib/db";

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        if (!credentials?.email || !credentials.password) {
          return null;
        }

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

        if (!user || !user.is_active) {
          return null;
        }

        const hashedInput = await hashPassword(credentials.password as string);

        if (hashedInput !== user.password_hash) {
          return null;
        }

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
});

