import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
const bcrypt = require("bcryptjs");
import { sql } from "@/lib/db";
import type { NextAuthConfig } from "next-auth";

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

        if (!rows.length) return null;

        const user = rows[0];
        if (!user.is_active) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash,
        );

        if (!isValid) return null;

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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.memberId = (user as any).memberId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).memberId = token.memberId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
