import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getWorkspaceId() {
    const session = await auth();
    if (!session?.user?.id) return null;
    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
    });
    return membership?.workspaceId ?? null;
}

// GET /api/outreach/:id — fetch single outreach
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const outreach = await prisma.outreach.findFirst({
            where: { id, workspaceId },
            include: {
                brand: { select: { id: true, name: true, industry: true, website: true } },
            },
        });

        if (!outreach) {
            return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
        }

        return NextResponse.json(outreach);
    } catch (error) {
        console.error("Error fetching outreach:", error);
        return NextResponse.json({ error: "Failed to fetch outreach" }, { status: 500 });
    }
}

// PATCH /api/outreach/:id — update outreach
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Verify ownership
        const existing = await prisma.outreach.findFirst({
            where: { id, workspaceId },
        });
        if (!existing) {
            return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
        }

        // Build update data — only include fields that were explicitly sent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {};

        // Brand brief fields
        if (body.brandName !== undefined) data.brandName = body.brandName;
        if (body.contactEmail !== undefined) data.contactEmail = body.contactEmail;
        if (body.product !== undefined) data.product = body.product;
        if (body.fitReason !== undefined) data.fitReason = body.fitReason;
        if (body.brandIndustry !== undefined) data.brandIndustry = body.brandIndustry;
        if (body.brandUrl !== undefined) data.brandUrl = body.brandUrl;

        // Email fields
        if (body.email1Subject !== undefined) data.email1Subject = body.email1Subject;
        if (body.email1Body !== undefined) data.email1Body = body.email1Body;
        if (body.email2Subject !== undefined) data.email2Subject = body.email2Subject;
        if (body.email2Body !== undefined) data.email2Body = body.email2Body;

        // Mark email 1 as sent
        if (body.markEmail1Sent) {
            data.email1SentAt = new Date();
            data.email2DueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days later
            data.status = "sent";
        }

        // Mark email 2 as sent
        if (body.markEmail2Sent) {
            data.email2SentAt = new Date();
            data.status = "followed_up";
        }

        // Mark as replied
        if (body.markReplied) {
            data.repliedAt = new Date();
            data.status = "replied";
        }

        // Proposal
        if (body.proposal !== undefined) data.proposal = body.proposal;
        if (body.markProposalSent) {
            data.proposalSentAt = new Date();
            data.status = "proposal_sent";
        }

        // Status overrides
        if (body.status !== undefined) {
            data.status = body.status;
            if (body.status === "archived") {
                data.archivedAt = new Date();
            }
            if (body.status !== "archived" && existing.status === "archived") {
                data.archivedAt = null;
            }
        }

        const outreach = await prisma.outreach.update({
            where: { id },
            data,
        });

        return NextResponse.json(outreach);
    } catch (error) {
        console.error("Error updating outreach:", error);
        return NextResponse.json({ error: "Failed to update outreach" }, { status: 500 });
    }
}

// DELETE /api/outreach/:id — remove outreach
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const workspaceId = await getWorkspaceId();
        if (!workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const existing = await prisma.outreach.findFirst({
            where: { id, workspaceId },
        });
        if (!existing) {
            return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
        }

        await prisma.outreach.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting outreach:", error);
        return NextResponse.json({ error: "Failed to delete outreach" }, { status: 500 });
    }
}
