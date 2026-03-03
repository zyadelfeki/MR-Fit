import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createAdminClient } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const bcrypt = await import("bcryptjs");
                const db = createAdminClient();

                // Use LEFT JOIN so login works even if profile doesn't exist yet
                const res = await db.query(
                    `SELECT u.id, u.email, u.password_hash, p.display_name
           FROM users u
           LEFT JOIN profiles p ON p.user_id = u.id
           WHERE u.email = $1`,
                    [credentials.email]
                );

                const user = res.rows[0];
                if (!user) return null;

                const valid = await bcrypt.compare(
                    credentials.password as string,
                    user.password_hash
                );
                if (!valid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.display_name ?? null,
                };
            },
        }),
    ],
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
});
