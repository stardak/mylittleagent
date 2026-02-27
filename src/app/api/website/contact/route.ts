/**
 * POST /api/website/contact
 * Handles contact form submissions from the public creator website.
 * Body: { name, email, message, workspaceSlug }
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, message, workspaceSlug } = body;

        if (!name || !email || !message || !workspaceSlug) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Look up the workspace by site slug
        const website = await prisma.creatorWebsite.findUnique({
            where: { slug: workspaceSlug },
            include: {
                workspace: {
                    include: { brandProfile: true },
                },
            },
        });

        if (!website || !website.isPublished) {
            return NextResponse.json({ error: "Website not found" }, { status: 404 });
        }

        const contactEmail = website.workspace.brandProfile?.contactEmail;
        if (!contactEmail) {
            return NextResponse.json({ error: "No contact email configured" }, { status: 422 });
        }

        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            const resend = new Resend(resendKey);
            const brandName = website.workspace.brandProfile?.brandName ?? "Creator";
            await resend.emails.send({
                from: "My Little Agent <noreply@myagent.app>",
                to: contactEmail,
                subject: `New enquiry from ${name} via your website`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1a1a1a;">New contact request for ${brandName}</h2>
                        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Message:</strong></p>
                            <p style="white-space: pre-wrap;">${message}</p>
                        </div>
                        <p style="color: #666; font-size: 12px;">Sent via your My Little Agent website.</p>
                    </div>
                `,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
