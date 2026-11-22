import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

import prisma from "@/lib/prisma";
import { isUserSessionInvalidated } from "@/lib/sessionInvalidation";
import { PLATFORMS } from "@/lib/constants";
import { consumeRecoveryCode, verifyTotpCode } from "@/lib/twoFactor";
import { checkRateLimit } from "@/lib/rateLimit";
import { getForwardedIp } from "@/lib/analyticsUtils";
import {
    TWO_FACTOR_INVALID_CODE_ERROR,
    TWO_FACTOR_REQUIRED_ERROR,
} from "@/lib/authErrors";

const TWO_FACTOR_LOGIN_LIMIT = 5;
const TWO_FACTOR_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const TWO_FACTOR_LOGIN_IP_LIMIT = 20;


const oauthProviders = new Set<string>([PLATFORMS.GITHUB, PLATFORMS.GOOGLE]);

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
                      // GitHub recently started returning an 'iss' parameter in OAuth callbacks.
                      // This requires configuring the issuer explicitly to prevent validation errors.
                      issuer: "https://github.com/login/oauth",
                  }),
              ]
            : []),

        Credentials({
            name: "Email & Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                totpCode: { label: "Two-factor code", type: "text" },
            },

            async authorize(credentials, req) {
                if (!credentials?.email || !credentials.password) return null;

                // Registration stores email lowercased/trimmed, so look it up
                // the same way — otherwise a differently-cased login is rejected.
                const email = credentials.email.trim().toLowerCase();

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.password) return null;

                if (!user.emailVerified) {
                    throw new Error("Please verify your email address to log in.");
                }

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isValid) return null;

                if (user.twoFactorEnabled) {
                    const code = credentials.totpCode ?? "";

                    if (!code) {
                        // Password is correct — now prompt for the 2FA code.
                        throw new Error(TWO_FACTOR_REQUIRED_ERROR);
                    }

                    // Rate-limit 2FA attempts by account identity and source IP.
                    const ip = req?.headers
                        ? getForwardedIp(
                              new Headers(
                                  req.headers as Record<string, string>
                              )
                          ) ?? "unknown"
                        : "unknown";

                    const accountAllowed = await checkRateLimit(
                        `2fa-login:${user.id}`,
                        TWO_FACTOR_LOGIN_LIMIT,
                        TWO_FACTOR_LOGIN_WINDOW_MS
                    );
                    const ipAllowed = await checkRateLimit(
                        `2fa-login-ip:${ip}`,
                        TWO_FACTOR_LOGIN_IP_LIMIT,
                        TWO_FACTOR_LOGIN_WINDOW_MS
                    );

                    if (!accountAllowed || !ipAllowed) {
                        throw new Error(
                            "Too many attempts. Please try again later."
                        );
                    }

                    const totpResult = user.totpSecret
                        ? await verifyTotpCode(
                              user.totpSecret,
                              code,
                              user.lastTotpStep
                          )
                        : null;

                    if (totpResult?.valid) {
                        // Persist the accepted time step atomically so the same
                        // code cannot be replayed by a concurrent request.
                        const updateResult = await prisma.user.updateMany({
                            where: { id: user.id, lastTotpStep: user.lastTotpStep },
                            data: { lastTotpStep: totpResult.timeStep },
                        });

                        if (updateResult.count === 0) {
                            throw new Error(TWO_FACTOR_INVALID_CODE_ERROR);
                        }

                        return user;
                    }

                    // Fall back to a one-time recovery code.
                    const remainingRecoveryCodes = await consumeRecoveryCode(
                        user.recoveryCodes,
                        code
                    );

                    if (remainingRecoveryCodes === null) {
                        throw new Error(TWO_FACTOR_INVALID_CODE_ERROR);
                    }

                    // Persist consumption conditionally so a raced consume
                    // cannot silently reuse the same code.
                    const updateResult = await prisma.user.updateMany({
                        where: { id: user.id, recoveryCodes: user.recoveryCodes },
                        data: { recoveryCodes: remainingRecoveryCodes },
                    });

                    if (updateResult.count === 0) {
                        throw new Error(TWO_FACTOR_INVALID_CODE_ERROR);
                    }

                    return user;
                }

                return user;
            },
        }),
    ],
events: {
    async createUser({ user }) {
        const account = await prisma.account.findFirst({
            where: { userId: user.id },
        });

        if (account && oauthProviders.has(account.provider)) {
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() },
            });
        }
    },
},
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account && oauthProviders.has(account.provider)) {
                if (!user.email) return true;

                let isVerified = false;
                if (account.provider === "google") {
                    isVerified =
                        (profile as { email_verified?: boolean } | null | undefined)
                            ?.email_verified === true;
                } else if (account.provider === "github") {
                    // NextAuth's GitHub provider only populates user.email with verified emails
                    isVerified = true;
                }

                if (!isVerified) return true;

                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    include: { accounts: true },
                });

                if (existingUser) {
                    const isAlreadyLinked = existingUser.accounts.some(
                        (acc) => acc.provider === account.provider
                    );

                    if (!isAlreadyLinked) {
                        await prisma.account.create({
                            data: {
                                userId: existingUser.id,
                                type: account.type,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                access_token: account.access_token,
                                token_type: account.token_type,
                                scope: account.scope,
                                id_token: account.id_token,
                                expires_at: account.expires_at,
                                refresh_token: account.refresh_token,
                                session_state: account.session_state as string | undefined,
                            },
                        });

                        if (!existingUser.emailVerified) {
                            await prisma.user.update({
                                where: { id: existingUser.id },
                                data: { emailVerified: new Date() },
                            });
                        }
                    }
                }
            }
            return true;
        },
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

            // Only query DB for image on the very first sign-in (token.image === undefined).
            // On subsequent requests token.image is explicitly set to null for users without
            // an image, preventing a redundant DB hit on every authenticated request.
            if (token.image === undefined && token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { image: true },
                });
                token.image = dbUser?.image ?? null;
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