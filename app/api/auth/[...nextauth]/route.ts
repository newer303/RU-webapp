import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(credentials.email) as any;

        if (!user || !user.password) return null;

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordCorrect) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      if (account.provider === "google") {
        if (!user.email) return false;
        try {
          const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(user.email);
          if (!existingUser) {
            db.prepare("INSERT INTO users (id, name, email, image) VALUES (?, ?, ?, ?)").run(
              user.id, user.name, user.email, user.image
            );
          }
          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }: any) {
      if (session.user) {
        const dbUser = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: string } | undefined;
        session.user.id = dbUser?.id || token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
