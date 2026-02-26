/**
 * POST /api/media-card/upload-pdf
 * Upload a PDF file and store the URL in BrandProfile.mediaPdfUrl.
 * Uses Vercel Blob storage.
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

async function getWorkspaceId(userId: string) {
    const membership = await prisma.membership.findFirst({ where: { userId } });
    return membership?.workspaceId ?? null;
}

export async function GET(_req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspaceId = await getWorkspaceId(session.user.id);
    if (!workspaceId) return NextResponse.json({ url: null });

    const rows = await prisma.$queryRaw<{ mediaPdfUrl: string | null }[]>`
        SELECT "mediaPdfUrl" FROM "BrandProfile" WHERE "workspaceId" = ${workspaceId} LIMIT 1
    `;
    return NextResponse.json({ url: rows[0]?.mediaPdfUrl ?? null });
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId(session.user.id);
    if (!workspaceId) {
        return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!file.type.includes("pdf")) {
        return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }
    if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json({ error: "File must be under 15 MB" }, { status: 400 });
    }

    let url: string;
    try {
        const blob = await put(`media-cards/${workspaceId}/${file.name}`, file, {
            access: "public",
            contentType: "application/pdf",
        });
        url = blob.url;
    } catch {
        return NextResponse.json({ error: "Upload failed — check Vercel Blob is configured (BLOB_READ_WRITE_TOKEN)" }, { status: 500 });
    }

    // Use raw SQL to update mediaPdfUrl — avoids stale Prisma TS types during build
    await prisma.$executeRaw`
        UPDATE "BrandProfile" SET "mediaPdfUrl" = ${url} WHERE "workspaceId" = ${workspaceId}
    `;

    return NextResponse.json({ url });
}

export async function DELETE(_req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspaceId = await getWorkspaceId(session.user.id);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    await prisma.$executeRaw`
        UPDATE "BrandProfile" SET "mediaPdfUrl" = NULL WHERE "workspaceId" = ${workspaceId}
    `;
    return NextResponse.json({ success: true });
}
