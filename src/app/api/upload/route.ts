import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await prisma.membership.findFirst({
            where: { userId: session.user.id },
        });

        if (!membership) {
            return NextResponse.json({ error: "No workspace found" }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const field = (formData.get("field") as string) || "heroImageUrl";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
                { status: 400 }
            );
        }

        // Validate size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large. Maximum 5MB." },
                { status: 400 }
            );
        }

        // Create uploads directory
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `${membership.workspaceId}-${field}-${Date.now()}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Write the file
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filepath, buffer);

        const url = `/uploads/${filename}`;

        // Update the brand profile with the image URL
        if (field === "heroImageUrl" || field === "logoUrl") {
            await prisma.brandProfile.update({
                where: { workspaceId: membership.workspaceId },
                data: { [field]: url },
            });
        }

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        );
    }
}
