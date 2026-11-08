import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

// GitHub login is turned on only when its keys are set in .env.
export const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

// Compared against when the email doesn't exist, so a wrong email takes as
// long as a wrong password (doesn't reveal which emails are registered).
const DUMMY_HASH = "$2b$12$cpSd2UJ7mOLFEUdrMO.gcO7EXns/An/0kxHbTXmjyeAYAc3iuZyC2";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;

      const user = await prisma.user.findUnique({ where: { email } });
      const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
      if (!user || !user.password || !ok) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

if (githubEnabled) providers.push(GitHub);

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Credentials login requires JWT sessions. OAuth accounts are still stored via the adapter.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user, trigger }) {
      // `user` is only present right after signing in.
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      // updateSession() (e.g. after editing the profile) refreshes the cookie.
      // Reload from the database instead of trusting the update payload, which a
      // client could also send.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { name: true, email: true, image: true, role: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.email = fresh.email;
          token.picture = fresh.image;
          token.role = fresh.role;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      session.user.role = token.role ?? "USER";
      return session;
    },
  },
});
