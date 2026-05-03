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
        console.log("AUTHORIZE CALLED");
        try {
          if (!credentials?.email || !credentials.password) return null;

          console.log("Trying email:", credentials.email);

          const rows = (await (sql as any)`
            SELECT id, email, password_hash, role, member_id, is_active
            FROM public.users
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

          console.log("Rows found:", rows.length);
          if (!rows.length) return null;

          const user = rows[0];
          console.log("Active:", user.is_active);
          console.log("Hash:", user.password_hash.substring(0, 10));

          if (!user.is_active) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash,
          );

          console.log("Password valid:", isValid);
          if (!isValid) return null;

          return {
            id: String(user.id),
            email: user.email,
            role: user.role,
            memberId: user.member_id,
          };
        } catch (err) {
          console.error("Auth error:", err);
          return null;
        }
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
