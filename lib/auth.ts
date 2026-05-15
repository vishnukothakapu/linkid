import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),

    providers: [
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                  Google({
                      clientId: process.env.GOOGLE_CLIENT_ID,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                  }),
              ]
            : []),

        ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
            ? [
                  GitHub({
                      clientId: process.env.GITHUB_CLIENT_ID,
                      clientSecret: process.env.GITHUB_CLIENT_SECRET,
                  }),
              ]
            : []),

        Credentials({
            name: "Email & Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },

            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                return isValid ? user : null;
            },
        }),
    ],

    events: {
        async createUser({ user }) {
            // OAuth providers already verify email
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() },
            });
        },
    },

    callbacks: {
        async jwt({ token, trigger, session, user }) {
            if (trigger === "update" && "image" in (session ?? {})) {
                token.image = session.image ?? null;
            }
            if (!token.image && user && "image" in user && user.image) {
                token.image = user.image;
                return token;
            }

            if (!token.image && token.email) {
                const user = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { image: true },
                });
                token.image = user?.image ?? null;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.image = token.image as string ?? null;
                session.user.id = token.sub as string;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
};
