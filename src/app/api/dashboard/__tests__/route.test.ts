import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { GET } from "../route";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
    default: {
        membership: { findFirst: vi.fn() },
        brand: { findMany: vi.fn() },
        invoice: { findMany: vi.fn() },
        deliverable: { findMany: vi.fn() },
        activity: { findMany: vi.fn() },
    },
}));
vi.mock("next/server", () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({
            body,
            status: init?.status ?? 200,
        })),
    },
}));

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const mockAuth = auth as MockedFunction<typeof auth>;
const mockMembership = prisma.membership.findFirst as MockedFunction<typeof prisma.membership.findFirst>;
const mockBrandFindMany = prisma.brand.findMany as MockedFunction<typeof prisma.brand.findMany>;
const mockInvoiceFindMany = prisma.invoice.findMany as MockedFunction<typeof prisma.invoice.findMany>;
const mockDeliverableFindMany = prisma.deliverable.findMany as MockedFunction<typeof prisma.deliverable.findMany>;
const mockActivityFindMany = prisma.activity.findMany as MockedFunction<typeof prisma.activity.findMany>;

const SESSION = { user: { id: "user-1" } };
const WORKSPACE_ID = "ws-1";
const MEMBERSHIP = { workspaceId: WORKSPACE_ID };

function defaults() {
    mockAuth.mockResolvedValueOnce(SESSION as never);
    mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
    mockInvoiceFindMany.mockResolvedValueOnce([]);
    mockDeliverableFindMany.mockResolvedValueOnce([]);
    mockActivityFindMany.mockResolvedValueOnce([]);
}

// ── GET /api/dashboard ────────────────────────────────────────────────────────

describe("GET /api/dashboard", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns 401 when unauthenticated", async () => {
        mockAuth.mockResolvedValueOnce(null);
        const res = await GET();
        expect((res as { status: number }).status).toBe(401);
    });

    it("computes pipelineValue as the sum of estimatedValue across brands", async () => {
        defaults();
        mockBrandFindMany.mockResolvedValueOnce([
            { estimatedValue: 1000, pipelineStage: "research" },
            { estimatedValue: 2500, pipelineStage: "negotiation" },
            { estimatedValue: null, pipelineStage: "research" }, // null should count as 0
        ] as never);

        const res = await GET();
        expect((res as { body: { stats: { pipelineValue: number } } }).body.stats.pipelineValue).toBe(3500);
    });

    it("computes activeBrands excluding 'lost' and 'paid' stages", async () => {
        defaults();
        mockBrandFindMany.mockResolvedValueOnce([
            { estimatedValue: 0, pipelineStage: "research" },     // active
            { estimatedValue: 0, pipelineStage: "negotiation" },  // active
            { estimatedValue: 0, pipelineStage: "lost" },          // excluded
            { estimatedValue: 0, pipelineStage: "paid" },          // excluded
        ] as never);

        const res = await GET();
        expect((res as { body: { stats: { activeBrands: number } } }).body.stats.activeBrands).toBe(2);
    });

    it("computes revenueMTD from paid invoices", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandFindMany.mockResolvedValueOnce([]);
        mockInvoiceFindMany.mockResolvedValueOnce([
            { total: 500 },
            { total: 1250 },
        ] as never);
        mockDeliverableFindMany.mockResolvedValueOnce([]);
        mockActivityFindMany.mockResolvedValueOnce([]);

        const res = await GET();
        expect((res as { body: { stats: { revenueMTD: number } } }).body.stats.revenueMTD).toBe(1750);
    });

    it("includes deliverablesDue count in stats", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandFindMany.mockResolvedValueOnce([]);
        mockInvoiceFindMany.mockResolvedValueOnce([]);
        mockDeliverableFindMany.mockResolvedValueOnce([{ id: "d-1" }, { id: "d-2" }] as never);
        mockActivityFindMany.mockResolvedValueOnce([]);

        const res = await GET();
        expect((res as { body: { stats: { deliverablesDue: number } } }).body.stats.deliverablesDue).toBe(2);
    });

    it("maps activities to the expected shape", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandFindMany.mockResolvedValueOnce([]);
        mockInvoiceFindMany.mockResolvedValueOnce([]);
        mockDeliverableFindMany.mockResolvedValueOnce([]);
        mockActivityFindMany.mockResolvedValueOnce([
            {
                id: "a-1",
                type: "brand_created",
                description: "Added Acme to pipeline",
                createdAt: new Date("2026-01-01T00:00:00Z"),
                brand: { name: "Acme" },
            },
        ] as never);

        const res = await GET();
        const activities = (res as { body: { activities: unknown[] } }).body.activities;
        expect(activities).toHaveLength(1);
        expect(activities[0]).toMatchObject({
            id: "a-1",
            type: "brand_created",
            brandName: "Acme",
            createdAt: "2026-01-01T00:00:00.000Z",
        });
    });
});
