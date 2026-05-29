import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Passord", type: "password" },
      },
      async authorize(credentials) {
        // Implement credential validation against Supabase in the app layer
        if (!credentials?.email || !credentials?.password) return null;
        return null;
      },
    }),
    // Vipps provider — aktiveres i fase 2
    // VippsProvider({ clientId: process.env.VIPPS_CLIENT_ID!, clientSecret: process.env.VIPPS_CLIENT_SECRET! }),

    // Feide provider — aktiveres i fase 2
    // FeideProvider({ clientId: process.env.FEIDE_CLIENT_ID!, clientSecret: process.env.FEIDE_CLIENT_SECRET! }),
  ],
  pages: {
    signIn: "/logg-inn",
    error: "/logg-inn",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);
