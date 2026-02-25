import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { id } = await params;
        const body = await req.json();

        const updated = await prisma.discountCode.update({
            where: { id },
            data: body,
        });

        return NextResponse.json({ discount: updated });
    } catch (err) {
        console.error("Update discount error:", err);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { id } = await params;
        await prisma.discountCode.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Delete discount error:", err);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
