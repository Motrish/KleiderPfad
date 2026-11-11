import NextAuth from "next-auth";
import Authentik from "next-auth/providers/authentik";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Authentik({
    clientId: process.env.AUTH_AUTHENTIK_ID,
    clientSecret: process.env.AUTH_AUTHENTIK_SECRET,
    issuer: process.env.AUTH_AUTHENTIK_ISSUER,
  })],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "authentik") token.oidcSubject = account.providerAccountId;
      return token;
    },
    async session({ session, token }) {
      if (typeof token.oidcSubject === "string") session.oidcSubject = token.oidcSubject;
      return session;
    },
  },
});
