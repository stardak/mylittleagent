/**
 * Anthropic client utilities for BYOK (Bring Your Own Key) architecture.
 *
 * Each workspace stores its own encrypted Anthropic API key.
 * This module handles fetching, decrypting, and instantiating
 * the Anthropic client per-workspace.
 */

import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";
import { decryptApiKey } from "@/lib/encryption";

export type AnthropicError = {
    type: "no_key" | "invalid_key" | "rate_limited" | "insufficient_credits" | "network_error" | "unknown";
    message: string;
};

/**
 * Get an Anthropic client for a workspace using their stored BYOK key.
 * Returns null if no key is configured.
 */
export async function getAnthropicClient(
    workspaceId: string
): Promise<Anthropic | null> {
    const brandProfile = await prisma.brandProfile.findUnique({
        where: { workspaceId },
        select: { anthropicApiKey: true },
    });

    if (!brandProfile?.anthropicApiKey) {
        return null;
    }

    try {
        const apiKey = decryptApiKey(brandProfile.anthropicApiKey);
        return new Anthropic({ apiKey });
    } catch (error) {
        console.error("Failed to decrypt API key for workspace:", workspaceId);
        throw error;
    }
}

/**
 * Test whether an API key is valid by making a lightweight API call.
 * Returns { valid: true } or { valid: false, error: AnthropicError }.
 */
export async function testApiKey(
    apiKey: string
): Promise<{ valid: true } | { valid: false; error: AnthropicError }> {
    try {
        const client = new Anthropic({ apiKey });
        await client.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 10,
            messages: [{ role: "user", content: "Say 'ok'" }],
        });
        return { valid: true };
    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        if (err.status === 401) {
            return {
                valid: false,
                error: {
                    type: "invalid_key",
                    message:
                        "This API key doesn't seem to work. Check it's correct and that you have billing enabled on console.anthropic.com",
                },
            };
        }
        if (err.status === 429) {
            return {
                valid: false,
                error: {
                    type: "rate_limited",
                    message: "Anthropic's API is busy right now. Try again in a moment.",
                },
            };
        }
        if (err.status === 400) {
            return {
                valid: false,
                error: {
                    type: "insufficient_credits",
                    message:
                        "Your Anthropic account needs more credits. Top up at console.anthropic.com",
                },
            };
        }
        return {
            valid: false,
            error: {
                type: "network_error",
                message: "Couldn't reach the AI service. Check your connection and try again.",
            },
        };
    }
}

/**
 * Format Anthropic API errors into user-friendly messages.
 */
export function formatAiError(error: unknown): AnthropicError {
    const err = error as { status?: number; message?: string };

    switch (err.status) {
        case 401:
            return {
                type: "invalid_key",
                message: "Your API key is no longer valid. Please update it in Settings → AI Manager.",
            };
        case 429:
            return {
                type: "rate_limited",
                message: "Anthropic's API is busy right now. Try again in a moment.",
            };
        case 400:
            return {
                type: "insufficient_credits",
                message: "Your Anthropic account needs more credits. Top up at console.anthropic.com",
            };
        default:
            return {
                type: "network_error",
                message: "Couldn't reach the AI service. Check your connection and try again.",
            };
    }
}
