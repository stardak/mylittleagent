"use client";

import { SectionProps } from "./WebsiteRenderer";
import { Platform } from "@prisma/client";

export function PlatformStatsSection({ platforms, profile, accentColor, headingFont }: SectionProps) {
    if (platforms.length === 0) return null;

    const combinedFollowers = platforms.reduce((sum, p) => sum + (p.followers ?? 0), 0);

    const formatNum = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M+`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
        return String(n);
    };

    const getPlatformIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes("youtube")) return (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        );
        if (t.includes("instagram")) return (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
        );
        if (t.includes("tiktok")) return (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
            </svg>
        );
        return (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
            </svg>
        );
    };

    const getPlatformColor = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes("youtube")) return "#FF0000";
        if (t.includes("instagram")) return "#E1306C";
        if (t.includes("tiktok")) return "#000000";
        return "#6366f1";
    };

    const demographics = platforms[0]?.demographics as Record<string, unknown> | null;
    const audienceSummary = profile?.audienceSummary;

    return (
        <section id="stats" className="py-24 md:py-32 bg-[#f9f8f6]">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                {/* Header */}
                <div className="mb-16">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>
                        Our Reach
                    </p>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1a1a1a] mb-6 max-w-3xl leading-tight" style={{ fontFamily: headingFont }}>
                        Audience that <span style={{ color: accentColor }}>listens, watches</span> and acts.
                    </h2>
                </div>

                {/* Platform Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {platforms.slice(0, 4).map((platform) => (
                        <div key={platform.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-5"
                                style={{ backgroundColor: getPlatformColor(platform.type) }}
                            >
                                {getPlatformIcon(platform.type)}
                            </div>
                            <h3 className="font-semibold text-[#1a1a1a] mb-1">{platform.displayName}</h3>
                            <p className="text-sm text-[#1a1a1a]/50 mb-5">{platform.handle}</p>
                            <div className="space-y-2">
                                {platform.followers != null && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[#1a1a1a]/60">Followers</span>
                                        <span className="text-lg font-semibold text-[#1a1a1a]">{formatNum(platform.followers)}</span>
                                    </div>
                                )}
                                {platform.avgViews != null && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[#1a1a1a]/60">Avg Views</span>
                                        <span className="text-sm font-medium text-[#1a1a1a]/80">{formatNum(platform.avgViews)}</span>
                                    </div>
                                )}
                                {platform.engagementRate != null && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[#1a1a1a]/60">Engagement</span>
                                        <span className="text-sm font-medium" style={{ color: accentColor }}>
                                            {(platform.engagementRate * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Combined Reach Banner */}
                {combinedFollowers > 0 && (
                    <div className="relative rounded-3xl overflow-hidden mb-16 text-center" style={{ backgroundColor: "#1a1a1a" }}>
                        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at center, ${accentColor} 0%, transparent 70%)` }} />
                        <div className="relative z-10 py-14 px-8">
                            <p className="text-sm tracking-[0.25em] uppercase text-white/50 font-medium mb-4">Combined Reach</p>
                            <div className="text-6xl md:text-8xl font-semibold mb-3" style={{ color: accentColor, fontFamily: headingFont }}>
                                {formatNum(combinedFollowers)}
                            </div>
                            <p className="text-white/60 text-lg">across all platforms</p>
                        </div>
                    </div>
                )}

                {/* Audience Summary */}
                {audienceSummary && (
                    <div className="rounded-2xl p-6 md:p-8 border" style={{ backgroundColor: accentColor + "0d", borderColor: accentColor + "33" }}>
                        <p className="text-[#1a1a1a]/80 text-lg">
                            <span className="font-semibold" style={{ color: accentColor }}>Audience Insight: </span>
                            {audienceSummary}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
