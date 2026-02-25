import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user + workspace + membership in a transaction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await prisma.$transaction(async (tx: any) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                },
            });

            // Create default workspace
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");

            const workspace = await tx.workspace.create({
                data: {
                    name: `${name}'s Workspace`,
                    slug: `${slug}-${Date.now().toString(36)}`,
                    plan: "trial",
                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                },
            });

            // Create membership (owner)
            await tx.membership.create({
                data: {
                    userId: user.id,
                    workspaceId: workspace.id,
                    role: "owner",
                },
            });

            // Create empty brand profile
            await tx.brandProfile.create({
                data: {
                    workspaceId: workspace.id,
                    brandName: name,
                },
            });

            return { user, workspace };
        });

        return NextResponse.json(
            {
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                },
                workspace: {
                    id: result.workspace.id,
                    name: result.workspace.name,
                    slug: result.workspace.slug,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Registration failed. Please try again." },
            { status: 500 }
        );
    }
}
