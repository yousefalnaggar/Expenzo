import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { seedDefaultCategories } from "@/lib/dal/categories";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        // Same return path whether the user doesn't exist, is OAuth-only (no
        // passwordHash), or the password is wrong — never reveal which case it was.
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Rate limiting on login attempts is added in Phase 7, not here.
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  events: {
    // Fires only for adapter-managed creation (Google OAuth first sign-in).
    // Credentials registration bypasses the adapter — that path seeds
    // categories itself in registerUser (src/lib/actions/auth-actions.ts).
    async createUser({ user }) {
      if (user.id) await seedDefaultCategories(user.id);
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) token.sub = user.id;
      // Fires when updateProfile() (src/lib/actions/user-actions.ts) calls
      // unstable_update() after a name/email/avatar change, so the JWT
      // reflects the edit immediately instead of waiting for the next login.
      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.email) token.email = session.user.email;
        // "image" in ... (not truthiness) so explicitly clearing the photo
        // back to null — see removeAvatar() — actually takes effect instead
        // of being skipped as falsy.
        if ("image" in session.user) token.picture = session.user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
