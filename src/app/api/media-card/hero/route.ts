import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Remove hero image
export async function DELETE() {
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

        await prisma.brandProfile.update({
            where: { workspaceId: membership.workspaceId },
            data: { heroImageUrl: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Hero image delete error:", error);
        return NextResponse.json({ error: "Failed to remove hero image" }, { status: 500 });
    }
}
