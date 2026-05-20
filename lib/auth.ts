import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

import prisma from "@/lib/prisma";
import { isUserSessionInvalidated } from "@/lib/sessionInvalidation";


const oauthProviders = new Set(["google", "github"]);

function getOAuthProfileImage(profile: unknown): string | null {
    if (!profile || typeof profile !== "object") return null;

    const data = profile as Record<string, unknown>;
    const candidates = [
        data.image,
        data.picture,
        data.avatar_url,
        data.avatarUrl,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim().length > 0) {
            return candidate;
        }
    }

    return null;
}

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
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() },
            });
        },
    },

    callbacks: {
        async jwt({ token, trigger, session, user, account, profile }) {
            // Immediately invalidate token if user account was deleted
            if (token.sub && (await isUserSessionInvalidated(token.sub))) {
                return {} as typeof token;
            }

            if (trigger === "update" && "image" in (session ?? {})) {
                token.image = session.image ?? null;
            }

            if (account?.provider && oauthProviders.has(account.provider)) {
                const oauthImage =
                    getOAuthProfileImage(profile) ??
                    (typeof user?.image === "string" ? user.image : null);

                if (oauthImage) {
                    const userId = user?.id ?? token.sub;
                    if (userId) {
                        try {
                            const result = await prisma.user.updateMany({
                                where: { id: userId, image: null },
                                data: { image: oauthImage },
                            });

                            if (result.count > 0) {
                                token.image = oauthImage;
                            } else if (!token.image) {
                                const existing = await prisma.user.findUnique({
                                    where: { id: userId },
                                    select: { image: true },
                                });
                                token.image = existing?.image ?? null;
                            }
                        } catch (error) {
                            console.error("OAuth avatar sync failed", error);
                        }
                    }
                }
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
            // If token was invalidated (account deleted), force empty session
            if (!token.sub) {
                return {} as typeof session;
            }
            if (session.user) {
                session.user.image = (token.image as string) ?? null;
                session.user.id = token.sub as string;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60,
    },
    pages: {
        signIn: "/login",
    },
};