import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { GET, POST } from "../route";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
    default: {
        membership: { findFirst: vi.fn() },
        brandProfile: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
        platform: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
        caseStudy: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
        testimonial: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
        setting: { findMany: vi.fn(), upsert: vi.fn() },
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
const mockBrandProfileFindUnique = prisma.brandProfile.findUnique as MockedFunction<typeof prisma.brandProfile.findUnique>;
const mockPlatformFindMany = prisma.platform.findMany as MockedFunction<typeof prisma.platform.findMany>;
const mockCaseStudyFindMany = prisma.caseStudy.findMany as MockedFunction<typeof prisma.caseStudy.findMany>;
const mockTestimonialFindMany = prisma.testimonial.findMany as MockedFunction<typeof prisma.testimonial.findMany>;
const mockSettingFindMany = prisma.setting.findMany as MockedFunction<typeof prisma.setting.findMany>;
const mockPlatformDeleteMany = prisma.platform.deleteMany as MockedFunction<typeof prisma.platform.deleteMany>;
const mockPlatformCreateMany = prisma.platform.createMany as MockedFunction<typeof prisma.platform.createMany>;
const mockSettingUpsert = prisma.setting.upsert as MockedFunction<typeof prisma.setting.upsert>;
const mockBrandProfileUpsert = prisma.brandProfile.upsert as MockedFunction<typeof prisma.brandProfile.upsert>;

const SESSION = { user: { id: "user-1" } };
const WORKSPACE_ID = "ws-1";
const MEMBERSHIP = { workspaceId: WORKSPACE_ID, workspace: {} };

// ── GET /api/onboarding ───────────────────────────────────────────────────────

describe("GET /api/onboarding", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns 401 when unauthenticated", async () => {
        mockAuth.mockResolvedValueOnce(null);
        const res = await GET();
        expect((res as { status: number }).status).toBe(401);
    });

    it("returns merged onboarding data with defaults for missing fields", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandProfileFindUnique.mockResolvedValueOnce(null);
        mockPlatformFindMany.mockResolvedValueOnce([]);
        mockCaseStudyFindMany.mockResolvedValueOnce([]);
        mockTestimonialFindMany.mockResolvedValueOnce([]);
        mockSettingFindMany.mockResolvedValueOnce([]);

        const res = await GET();
        const body = (res as { body: Record<string, unknown> }).body;

        expect(body.brandName).toBe("");
        expect(body.platforms).toEqual([]);
        expect(body.caseStudies).toEqual([]);
        expect(body.testimonials).toEqual([]);
        // API key should never be returned
        expect(body.anthropicApiKey).toBe("");
    });

    it("maps platform data to the expected shape", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandProfileFindUnique.mockResolvedValueOnce(null);
        mockPlatformFindMany.mockResolvedValueOnce([
            { type: "youtube", handle: "@test", followers: 10000, avgViews: 5000, engagementRate: 4.5 },
        ] as never);
        mockCaseStudyFindMany.mockResolvedValueOnce([]);
        mockTestimonialFindMany.mockResolvedValueOnce([]);
        mockSettingFindMany.mockResolvedValueOnce([]);

        const res = await GET();
        const platforms = (res as { body: { platforms: unknown[] } }).body.platforms;
        expect(platforms[0]).toMatchObject({
            type: "youtube",
            handle: "@test",
            followers: "10000",
            avgViews: "5000",
            engagementRate: "4.5",
        });
    });

    it("reads settings by key and exposes aiManagerName", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandProfileFindUnique.mockResolvedValueOnce(null);
        mockPlatformFindMany.mockResolvedValueOnce([]);
        mockCaseStudyFindMany.mockResolvedValueOnce([]);
        mockTestimonialFindMany.mockResolvedValueOnce([]);
        mockSettingFindMany.mockResolvedValueOnce([
            { key: "ai_manager_name", value: "Max" },
        ] as never);

        const res = await GET();
        expect((res as { body: { aiManagerName: string } }).body.aiManagerName).toBe("Max");
    });
});

// ── POST /api/onboarding ──────────────────────────────────────────────────────

function makePostRequest(body: object) {
    return new Request("http://localhost/api/onboarding", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

describe("POST /api/onboarding", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns 401 when unauthenticated", async () => {
        mockAuth.mockResolvedValueOnce(null);
        const res = await POST(makePostRequest({ step: "brand", data: {} }));
        expect((res as { status: number }).status).toBe(401);
    });

    it("returns 404 when no membership found", async () => {
        mockAuth.mockResolvedValueOnce(SESSION as never);
        mockMembership.mockResolvedValueOnce(null);
        const res = await POST(makePostRequest({ step: "brand", data: {} }));
        expect((res as { status: number }).status).toBe(404);
    });

    it("step=brand upserts the brand profile with brandName", async () => {
        mockAuth.mockResolvedValue(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockBrandProfileUpsert.mockResolvedValueOnce({} as never);

        const res = await POST(makePostRequest({ step: "brand", data: { brandName: "Acme" } }));

        expect(mockBrandProfileUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { workspaceId: WORKSPACE_ID },
                create: expect.objectContaining({ brandName: "Acme" }),
            })
        );
        expect((res as { body: { success: boolean } }).body.success).toBe(true);
    });

    it("step=platforms deletes existing and creates new platforms", async () => {
        mockAuth.mockResolvedValue(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockPlatformDeleteMany.mockResolvedValueOnce({} as never);
        mockPlatformCreateMany.mockResolvedValueOnce({} as never);

        const res = await POST(
            makePostRequest({
                step: "platforms",
                data: {
                    platforms: [
                        { type: "youtube", handle: "@test", followers: "10000", avgViews: "5000", engagementRate: "4.5" },
                    ],
                },
            })
        );

        expect(mockPlatformDeleteMany).toHaveBeenCalledOnce();
        expect(mockPlatformCreateMany).toHaveBeenCalledOnce();
        expect((res as { body: { success: boolean } }).body.success).toBe(true);
    });

    it("step=done marks onboarding as complete", async () => {
        mockAuth.mockResolvedValue(SESSION as never);
        mockMembership.mockResolvedValueOnce(MEMBERSHIP as never);
        mockSettingUpsert.mockResolvedValueOnce({} as never);

        const res = await POST(makePostRequest({ step: "done", data: {} }));

        expect(mockSettingUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                create: expect.objectContaining({ key: "onboarding_complete", value: "true" }),
            })
        );
        expect((res as { body: { success: boolean } }).body.success).toBe(true);
    });
});
