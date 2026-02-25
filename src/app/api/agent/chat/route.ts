import { streamText, stepCountIs } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { buildSystemPrompt } from "@/lib/agent/prompt";
import { makeAgentTools } from "@/lib/agent/tools";

async function getSessionData() {
    const session = await auth();
    if (!session?.user?.id) return null;
    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
    });
    if (!membership) return null;
    return { userId: session.user.id, workspaceId: membership.workspaceId };
}

/**
 * POST /api/agent/chat — streaming chat endpoint with tool calling
 *
 * Expects body: {
 *   messages: [{ role, content }],
 *   conversationId?: string
 * }
 *
 * Compatible with Vercel AI SDK's useChat hook.
 * Now supports tool calling — the agent can create pipeline entries,
 * draft emails, check campaign status, and more.
 */
export async function POST(req: Request) {
    try {
        const sessionData = await getSessionData();
        if (!sessionData) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { workspaceId, userId } = sessionData;

        // Get the encrypted API key
        const profile = await prisma.brandProfile.findUnique({
            where: { workspaceId },
            select: { anthropicApiKey: true },
        });

        if (!profile?.anthropicApiKey) {
            return NextResponse.json(
                { error: "No API key configured. Add your Anthropic API key in Settings → AI Manager." },
                { status: 422 }
            );
        }

        const apiKey = decryptApiKey(profile.anthropicApiKey);
        const anthropic = createAnthropic({ apiKey });

        const body = await req.json();
        const { messages, conversationId } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages are required" }, { status: 400 });
        }

        // Build or reuse conversation
        let convoId = conversationId;
        if (!convoId) {
            const convo = await prisma.conversation.create({
                data: {
                    workspaceId,
                    title: null,
                },
            });
            convoId = convo.id;
        }

        // Save the user message
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage?.role === "user") {
            await prisma.message.create({
                data: {
                    conversationId: convoId,
                    role: "user",
                    content: lastUserMessage.content,
                },
            });
        }

        // Build system prompt with workspace context
        const systemPrompt = await buildSystemPrompt(workspaceId);

        // Build workspace-scoped tools
        const tools = makeAgentTools(workspaceId, userId);

        // Stream the response with tool calling support
        const result = streamText({
            model: anthropic("claude-sonnet-4-5-20250929"),
            system: systemPrompt,
            messages: messages.map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
            tools,
            stopWhen: stepCountIs(5),
            maxOutputTokens: 4096,
            onFinish: async ({ text, usage, toolCalls }) => {
                try {
                    // Persist assistant response
                    await prisma.message.create({
                        data: {
                            conversationId: convoId,
                            role: "assistant",
                            content: text,
                            tokenCount: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0) || null,
                            toolCalls: toolCalls && toolCalls.length > 0
                                ? JSON.parse(JSON.stringify(toolCalls.map((tc) => ({
                                    toolName: tc.toolName,
                                    input: tc.input,
                                }))))
                                : undefined,
                        },
                    });

                    // Auto-generate title from first exchange
                    const convo = await prisma.conversation.findUnique({
                        where: { id: convoId },
                        select: { title: true },
                    });

                    if (!convo?.title && lastUserMessage?.content) {
                        const autoTitle =
                            lastUserMessage.content.length > 50
                                ? lastUserMessage.content.substring(0, 47) + "..."
                                : lastUserMessage.content;

                        await prisma.conversation.update({
                            where: { id: convoId },
                            data: {
                                title: autoTitle,
                                updatedAt: new Date(),
                            },
                        });
                    } else {
                        await prisma.conversation.update({
                            where: { id: convoId },
                            data: { updatedAt: new Date() },
                        });
                    }
                } catch (err) {
                    console.error("Failed to persist agent response:", err);
                }
            },
        });

        // Return streaming response with conversation ID in headers
        const response = result.toTextStreamResponse();
        response.headers.set("x-conversation-id", convoId);

        return response;
    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        console.error("Agent chat error:", error);

        if (err.status === 401) {
            return NextResponse.json(
                { error: "Your API key is no longer valid. Please update it in Settings → AI Manager." },
                { status: 422 }
            );
        }
        if (err.status === 429) {
            return NextResponse.json(
                { error: "Anthropic's API is busy right now. Try again in a moment." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
