/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Force NextAuth to use the production URL instead of the Vercel branch URL
process.env.AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "https://mylittleagent.vercel.app";
process.env.NEXTAUTH_URL = process.env.NEXT_PUBLIC_NEXTAUTH_URL || "https://mylittleagent.vercel.app";

export const authConfig: NextAuthConfig = {
    debug: true,
    trustHost: true,
    secret: process.env.AUTH_SECRET || "fallback_secret_for_vercel_builds_only",
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user || !user.passwordHash) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: (user as any).image || (user as any).avatar,
                };
            },
        }),
    ],
    events: {
        async createUser({ user }) {
            // When a user is created via OAuth (like Google), they need a Workspace
            if (user.id && user.name) {
                const slug = user.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");

                await prisma.$transaction(async (tx) => {
                    const workspace = await tx.workspace.create({
                        data: {
                            name: `${user.name}'s Workspace`,
                            slug: `${slug}-${Date.now().toString(36)}`,
                            plan: "trial",
                            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                        },
                    });

                    await tx.membership.create({
                        data: {
                            userId: user.id as string,
                            workspaceId: workspace.id,
                            role: "owner",
                        },
                    });

                    await tx.brandProfile.create({
                        data: {
                            workspaceId: workspace.id,
                            brandName: user.name as string,
                        },
                    });
                });
                console.log(`[auth] Created default workspace for new OAuth user: ${user.email}`);
            }
        },
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                // Fetch isAdmin
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id as string },
                    select: { isAdmin: true },
                });
                token.isAdmin = dbUser?.isAdmin ?? false;
                // Update lastLoginAt
                await prisma.user.update({
                    where: { id: user.id as string },
                    data: { lastLoginAt: new Date() },
                }).catch(() => { });
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;

                // Fetch active workspace
                let membership = await prisma.membership.findFirst({
                    where: { userId: token.id as string },
                    include: { workspace: true },
                    orderBy: { createdAt: "asc" },
                });

                // LAZY CREATION FALLBACK
                // If an OAuth user was created before we added the createUser event,
                // they won't have a workspace. Create one for them now.
                if (!membership && session.user.name) {
                    const slug = session.user.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "");

                    try {
                        await prisma.$transaction(async (tx) => {
                            const newWorkspace = await tx.workspace.create({
                                data: {
                                    name: `${session.user.name}'s Workspace`,
                                    slug: `${slug}-${Date.now().toString(36)}`,
                                    plan: "trial",
                                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                                },
                            });

                            membership = await tx.membership.create({
                                data: {
                                    userId: token.id as string,
                                    workspaceId: newWorkspace.id,
                                    role: "owner",
                                },
                                include: { workspace: true },
                            }) as any;

                            await tx.brandProfile.create({
                                data: {
                                    workspaceId: newWorkspace.id,
                                    brandName: session.user.name as string,
                                },
                            });
                        });
                        console.log(`[auth] Lazily created workspace for existing OAuth user: ${session.user.email}`);
                    } catch (e) {
                        console.error("[auth] Failed to lazily create workspace", e);
                    }
                }

                if (membership) {
                    (session as any).activeWorkspaceId = membership.workspaceId;
                    (session as any).activeWorkspaceName = membership.workspace.name;
                    (session as any).activeWorkspaceSlug = membership.workspace.slug;
                    (session as any).role = membership.role;
                }
                (session as any).isAdmin = token.isAdmin ?? false;
            }
            return session;
        },
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
