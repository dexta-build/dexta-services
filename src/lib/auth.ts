import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { logAudit, recentFailedLogins } from "@/lib/admin/audit";
import type { AdminRole } from "@/lib/admin/permissions";
import {
  findAdminUser,
  normaliseEmail,
  touchLastLogin,
} from "@/lib/admin/users";
import { getClientIp } from "@/lib/rate-limit";

declare module "next-auth" {
  interface User {
    role?: AdminRole;
    access?: string[];
  }
  interface Session {
    user: {
      id: string;
      role: AdminRole;
      access: string[];
      /** When this session was issued (ms), to reject old sessions. */
      issuedAt: number;
    } & DefaultSession["user"];
  }
}

/** Sign-in lockout: failed attempts allowed per 15 minutes. */
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_PER_EMAIL = 5;
export const LOGIN_MAX_PER_IP = 20;

/** How often the session re-checks role/access/disabled in the database. */
const REFRESH_MS = 5 * 60 * 1000;

async function clientIp() {
  try {
    return getClientIp(await headers());
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email;
        const password = credentials?.password;
        if (typeof rawEmail !== "string" || typeof password !== "string") {
          return null;
        }
        const email = normaliseEmail(rawEmail);
        const ip = await clientIp();

        // Lockout (database-backed, so it holds across serverless instances).
        const failed = await recentFailedLogins(email, ip, LOGIN_WINDOW_MS);
        if (
          failed.byEmail >= LOGIN_MAX_PER_EMAIL ||
          failed.byIp >= LOGIN_MAX_PER_IP
        ) {
          await logAudit({
            action: "auth.login_blocked",
            area: "auth",
            summary: "Sign-in blocked after too many failed attempts",
            actor: { email },
          });
          return null;
        }

        const user = await findAdminUser({ email });
        const valid =
          !!user &&
          user.isActive &&
          (await bcrypt.compare(password, user.password));

        if (!user || !valid) {
          await logAudit({
            action: "auth.login_failed",
            area: "auth",
            summary: !user
              ? "Unknown email"
              : !user.isActive
                ? "Account disabled"
                : "Wrong password",
            actor: { id: user?.id, email },
          });
          return null;
        }

        await touchLastLogin(user.id);
        await logAudit({
          action: "auth.login",
          area: "auth",
          summary: "Signed in",
          actor: { id: user.id, email: user.email, name: user.name },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          access: user.access,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  callbacks: {
    async jwt({ token, user }) {
      const now = Date.now();
      if (user) {
        token.uid = user.id;
        token.role = user.role ?? "ADMIN";
        token.access = user.access ?? [];
        token.issuedAt = now;
        token.checkedAt = now;
        return token;
      }
      // Re-check the database now and then: role changes take effect, and
      // disabled users or reset passwords end the session.
      if (
        typeof token.checkedAt !== "number" ||
        now - token.checkedAt > REFRESH_MS
      ) {
        const fresh =
          typeof token.uid === "string"
            ? await findAdminUser({ id: token.uid }).catch(() => undefined)
            : null;
        if (fresh === null) return null;
        if (fresh) {
          const issued =
            typeof token.issuedAt === "number" ? token.issuedAt : 0;
          if (
            !fresh.isActive ||
            (fresh.sessionsValidFrom &&
              fresh.sessionsValidFrom.getTime() > issued)
          ) {
            return null;
          }
          token.role = fresh.role;
          token.access = fresh.access;
          token.name = fresh.name;
        }
        token.checkedAt = now;
      }
      return token;
    },
    session({ session, token }) {
      session.user = {
        ...session.user,
        id: String(token.uid ?? ""),
        email: String(token.email ?? session.user?.email ?? ""),
        name: String(token.name ?? session.user?.name ?? ""),
        role: (token.role as AdminRole) ?? "ADMIN",
        access: Array.isArray(token.access) ? (token.access as string[]) : [],
        issuedAt: typeof token.issuedAt === "number" ? token.issuedAt : 0,
      };
      return session;
    },
  },
});
