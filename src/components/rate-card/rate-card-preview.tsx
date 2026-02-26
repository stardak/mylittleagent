"use client";

import { forwardRef } from "react";
import type { MediaCardData } from "@/components/media-card/media-card-preview";

export interface RatePackage {
    id: string;
    name: string;
    price: string;
    description: string;
    isUsageRights?: boolean;
    isExamplePackage?: boolean;
}

export interface RateCardData extends MediaCardData {
    rateCard: RatePackage[];
}

// Helper for formatting large numbers
function formatNumber(n: number | null | undefined): string {
    if (n == null) return "—";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    return n.toLocaleString();
}

function getPlatformLabel(type: string): string {
    const map: Record<string, string> = {
        youtube: "YouTube Subscribers",
        instagram: "Instagram Followers",
        tiktok: "TikTok Followers",
        twitter: "X Followers",
    };
    return map[type.toLowerCase()] || type;
}

interface RateCardPreviewProps {
    data: RateCardData;
    onUploadClick?: () => void;
}

// Strip all leading @ symbols from a handle string
function cleanHandle(handle: string): string {
    return handle.replace(/^@+/, "");
}

export const RateCardPreview = forwardRef<HTMLDivElement, RateCardPreviewProps>(
    function RateCardPreview({ data, onUploadClick }, ref) {
        // Fallback color to the greenish brand color from the PDF
        const accent = data.brand.primaryColor || "#38bdf8";

        const hasHero = !!data.brand.heroImageUrl;

        // Group packages
        const standardPackages = data.rateCard.filter(p => !p.isUsageRights && !p.isExamplePackage);
        const usageRights = data.rateCard.filter(p => p.isUsageRights);
        const examplePackages = data.rateCard.filter(p => p.isExamplePackage);

        return (
            <div
                style={{
                    transformOrigin: "top left",
                    transform: "scale(0.8)",
                    width: 794 * 0.8,
                    height: (1123 * 2 + 20) * 0.8,
                }}
            >
                <div
                    ref={ref}
                    style={{
                        width: 794, // A4 width at 96dpi
                        background: "#ffffff",
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        color: "#333333",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* ── PAGE 1: OVERVIEW ── */}
                    <div style={{ height: 1123, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        {/* Top Green Bar */}
                        <div style={{ height: 24, backgroundColor: accent, width: "100%" }} />

                        <div style={{ padding: "80px 60px", flex: 1, display: "flex", flexDirection: "column" }}>

                            {/* Header Section */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 60 }}>
                                <div style={{ maxWidth: "50%" }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: 1 }}>
                                        {data.brand.name.split(" ")[0]}
                                    </div>
                                    <h1 style={{ fontSize: 48, fontWeight: 800, margin: "0 0 4px", lineHeight: 1, textTransform: "uppercase", color: "#111" }}>
                                        {data.brand.name.split(" ").slice(1).join(" ")}
                                    </h1>
                                    <div style={{ height: 4, width: 90, backgroundColor: accent, marginBottom: 24 }} />

                                    <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                                        Content Creator {data.brand.location ? <>&nbsp;|&nbsp; {data.brand.location}</> : null}<br />
                                        {data.platforms[0] ? `@${cleanHandle(data.platforms[0].handle)}` : ""}
                                    </div>

                                    {data.brand.bio && (
                                        <p style={{ marginTop: 40, fontSize: 14, lineHeight: 1.7, color: "#555" }}>
                                            {data.brand.bio}
                                        </p>
                                    )}
                                </div>

                                {/* Hero Image */}
                                <div style={{ width: 300, height: 380, backgroundColor: "#f0f0f0", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                                    {hasHero ? (
                                        <img
                                            src={data.brand.heroImageUrl!}
                                            alt={data.brand.name}
                                            crossOrigin="anonymous"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div
                                            onClick={onUploadClick}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#aaa",
                                                fontSize: 12,
                                                gap: 8,
                                                cursor: onUploadClick ? "pointer" : "default",
                                                transition: "background 0.2s",
                                            }}
                                            title={onUploadClick ? "Click to upload a hero image" : undefined}
                                        >
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                            {onUploadClick ? "Click to upload image" : "No Image Provided"}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: 1, backgroundColor: "#eaeaea", width: "100%", margin: "40px 0" }} />

                            {/* Stats Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 40 }}>
                                {data.platforms.slice(0, 4).map((p, i) => (
                                    <div key={i} style={{ backgroundColor: "#f8f9fa", borderRadius: 12, padding: "24px 20px", textAlign: "center" }}>
                                        <div style={{ fontSize: 32, fontWeight: 800, color: accent, marginBottom: 8 }}>
                                            {formatNumber(p.followers)}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#666" }}>
                                            {getPlatformLabel(p.type)}
                                        </div>
                                    </div>
                                ))}
                                {/* Extra stat blocks to fill grid if needed */}
                                <div style={{ backgroundColor: "#f8f9fa", borderRadius: 12, padding: "24px 20px", textAlign: "center" }}>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: accent, marginBottom: 8 }}>
                                        {data.totals.avgEngagement > 0 ? `${data.totals.avgEngagement}%` : "—"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#666" }}>
                                        Engagement Rate
                                    </div>
                                </div>
                                <div style={{ backgroundColor: "#f8f9fa", borderRadius: 12, padding: "24px 20px", textAlign: "center" }}>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: accent, marginBottom: 8 }}>
                                        50M+
                                    </div>
                                    <div style={{ fontSize: 11, color: "#666" }}>
                                        Total Views
                                    </div>
                                </div>
                            </div>

                            {/* Audience Snapshot */}
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: "#111" }}>Audience Snapshot</h3>
                                {data.brand.audienceSummary ? (
                                    <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: 0 }}>
                                        {data.brand.audienceSummary}
                                    </p>
                                ) : (
                                    <div style={{ fontSize: 13, color: "#666", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                        {data.platforms[0]?.genderFemale ? `${Math.round(data.platforms[0].genderFemale)}% Female` : "80% Female"}
                                        &nbsp;|&nbsp;
                                        {data.platforms[0]?.ageRange1Pct && data.platforms[0]?.ageRange1 ? `${Math.round(data.platforms[0].ageRange1Pct)}% aged ${data.platforms[0].ageRange1}` : "50% aged 25-34"}
                                        &nbsp;|&nbsp;
                                        {data.platforms[0]?.topCountry1Pct && data.platforms[0]?.topCountry1 ? `${Math.round(data.platforms[0].topCountry1Pct)}% ${data.platforms[0].topCountry1}` : "45% UK"}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Bottom Green Bar */}
                        <div style={{ height: 40, backgroundColor: accent, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: 11, fontWeight: 600, gap: "16px" }}>
                            <span>{data.brand.contactEmail || "hello@example.com"}</span>
                            <span>•</span>
                            <span>{data.platforms[0] ? `@${cleanHandle(data.platforms[0].handle)}` : "@creator"}</span>
                            <span>•</span>
                            <span>Self-Managed</span>
                            <span>•</span>
                            <span>{new Date().getFullYear()}</span>
                        </div>
                    </div>

                    {/* ── PAGE OVERFLOW DIVIDER (For viewing context only, not saved in export) ── */}
                    <div style={{ height: 20, backgroundColor: "#e5e7eb", width: "100%" }} className="print-hidden" />

                    {/* ── PAGE 2: RATES & PACKAGES ── */}
                    <div style={{ height: 1123, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>

                        <div style={{ padding: "80px 60px", flex: 1, display: "flex", flexDirection: "column" }}>

                            {/* Header */}
                            <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", textTransform: "uppercase", color: "#111" }}>RATES</h2>
                            <div style={{ fontSize: 22, color: accent, marginBottom: 8 }}>Rate Card</div>
                            <div style={{ fontSize: 14, color: "#666" }}>Prepared for partners &nbsp;|&nbsp; {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>

                            <div style={{ height: 1, backgroundColor: "#eaeaea", width: "100%", margin: "32px 0 40px" }} />

                            {/* Standard Packages */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                {standardPackages.map((pkg, i) => (
                                    <div key={i} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "stretch",
                                        paddingBottom: i < standardPackages.length - 1 ? 24 : 0,
                                        borderBottom: i < standardPackages.length - 1 ? "1px solid #eaeaea" : "none"
                                    }}>
                                        <div style={{ flex: 1, paddingRight: 40 }}>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8, letterSpacing: "-0.01em" }}>
                                                {pkg.name}
                                            </div>
                                            {pkg.description && (
                                                <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                                                    {pkg.description}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "flex-start",
                                            alignItems: "flex-end",
                                            minWidth: 160
                                        }}>
                                            <div style={{
                                                fontSize: 22,
                                                fontWeight: 800,
                                                color: accent,
                                                backgroundColor: `${accent}15`,
                                                padding: "10px 20px",
                                                borderRadius: 8,
                                                textAlign: "right",
                                                whiteSpace: "nowrap"
                                            }}>
                                                {pkg.price}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Usage Rights (if any) */}
                            {usageRights.length > 0 && (
                                <div style={{ marginTop: 40, paddingTop: 32, borderTop: "2px solid #111" }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: 1 }}>Usage & Licensing Modifiers</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                                        {usageRights.map((pkg, i) => (
                                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fbfbfb", padding: "16px 24px", borderRadius: 8, border: "1px solid #eaeaea" }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: pkg.description ? 4 : 0 }}>
                                                        {pkg.name}
                                                    </div>
                                                    {pkg.description && (
                                                        <div style={{ fontSize: 12, color: "#777", lineHeight: 1.5 }}>
                                                            {pkg.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: accent, marginLeft: 24, padding: "6px 16px", backgroundColor: "#fff", border: `1px solid ${accent}40`, borderRadius: 20, whiteSpace: "nowrap" }}>
                                                    {pkg.price}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Example Packages (if any) */}
                            {examplePackages.length > 0 && (
                                <div style={{ marginTop: 40, flex: 1 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: 1 }}>Featured Bundle</h3>
                                    <div style={{
                                        backgroundColor: `${accent}05`,
                                        borderRadius: 16,
                                        padding: "32px",
                                        border: `1px solid ${accent}30`,
                                        position: "relative",
                                        overflow: "hidden"
                                    }}>
                                        {/* Decorative element */}
                                        <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", backgroundColor: accent }} />

                                        {examplePackages.map((pkg, i) => (
                                            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: i < examplePackages.length - 1 ? 40 : 0 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <div style={{ fontSize: 20, fontWeight: 800, color: "#111", maxWidth: "70%" }}>
                                                        {pkg.name}
                                                    </div>
                                                    <div style={{ fontSize: 24, fontWeight: 800, color: accent, whiteSpace: "nowrap" }}>
                                                        {pkg.price}
                                                    </div>
                                                </div>

                                                {pkg.description && (
                                                    <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7, backgroundColor: "#fff", padding: "20px 24px", borderRadius: 8, border: "1px solid #eaeaea", whiteSpace: "pre-wrap" }}>
                                                        {pkg.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px dashed ${accent}40`, fontSize: 11, color: "#666", lineHeight: 1.8 }}>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: accent }} />
                                                    Bundle discounts available for multi-content packages.
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: accent }} />
                                                    Paid media usage priced separately on request.
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: accent }} />
                                                    Rates valid for 30 days.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Bottom Green Bar */}
                        <div style={{ height: 40, backgroundColor: accent, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: 11, fontWeight: 600, gap: "16px", marginTop: "auto" }}>
                            <span>{data.brand.contactEmail || "hello@example.com"}</span>
                            <span>•</span>
                            <span>{data.platforms[0] ? `@${cleanHandle(data.platforms[0].handle)}` : "@creator"}</span>
                            <span>•</span>
                            <span>Self-Managed</span>
                            <span>•</span>
                            <span>{new Date().getFullYear()}</span>
                        </div>
                    </div>

                </div>
            </div>
        );
    }
);
