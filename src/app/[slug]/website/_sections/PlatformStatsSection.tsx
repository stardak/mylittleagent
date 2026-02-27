"use client";

import { SectionProps } from "./WebsiteRenderer";
import { EditableField } from "@/components/website/EditableField";

export function PlatformStatsSection({ platforms, profile, accentColor, headingFont, copyOverrides = {}, editMode, onEdit }: SectionProps) {
    if (platforms.length === 0 && !editMode) return null;

    const combinedFollowers = platforms.reduce((sum, p) => sum + (p.followers ?? 0), 0);
    const sectionHeading = copyOverrides["stats.heading"] ?? "Audience that listens, watches and acts.";
    const audienceSummary = copyOverrides["stats.audienceSummary"] ?? profile?.audienceSummary ?? "";

    const formatNum = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M+`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
        return String(n);
    };

    const getPlatformColor = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes("youtube")) return "#FF0000";
        if (t.includes("instagram")) return "#E1306C";
        if (t.includes("tiktok")) return "#000000";
        return "#6366f1";
    };

    return (
        <section id="stats" className="py-24 md:py-32 bg-[#f9f8f6]">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="mb-16">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>Our Reach</p>
                    <EditableField field="stats.heading" value={sectionHeading} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1a1a1a] mb-6 max-w-3xl leading-tight" style={{ fontFamily: headingFont }}>
                            {sectionHeading}
                        </h2>
                    </EditableField>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {platforms.slice(0, 4).map((platform) => (
                        <div key={platform.id} className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-5"
                                style={{ backgroundColor: getPlatformColor(platform.type) }}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" /></svg>
                            </div>
                            <h3 className="font-semibold text-[#1a1a1a] mb-1">{platform.displayName}</h3>
                            <p className="text-sm text-[#1a1a1a]/50 mb-5">{platform.handle}</p>
                            <div className="space-y-2">
                                {platform.followers != null && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-[#1a1a1a]/60">Followers</span>
                                        <span className="text-lg font-semibold text-[#1a1a1a]">{formatNum(platform.followers)}</span>
                                    </div>
                                )}
                                {platform.engagementRate != null && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-[#1a1a1a]/60">Engagement</span>
                                        <span className="text-sm font-medium" style={{ color: accentColor }}>{(platform.engagementRate * 100).toFixed(1)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {combinedFollowers > 0 && (
                    <div className="relative rounded-3xl overflow-hidden mb-16 text-center bg-[#1a1a1a]">
                        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at center, ${accentColor} 0%, transparent 70%)` }} />
                        <div className="relative z-10 py-14 px-8">
                            <p className="text-sm tracking-[0.25em] uppercase text-white/50 font-medium mb-4">Combined Reach</p>
                            <div className="text-6xl md:text-8xl font-semibold mb-3" style={{ color: accentColor, fontFamily: headingFont }}>{formatNum(combinedFollowers)}</div>
                            <p className="text-white/60 text-lg">across all platforms</p>
                        </div>
                    </div>
                )}

                {(audienceSummary || editMode) && (
                    <div className="rounded-2xl p-6 md:p-8 border" style={{ backgroundColor: accentColor + "0d", borderColor: accentColor + "33" }}>
                        <EditableField field="stats.audienceSummary" value={audienceSummary} editMode={editMode} onEdit={onEdit} multiline accentColor={accentColor} wrapClassName="block">
                            <p className="text-[#1a1a1a]/80 text-lg">
                                <span className="font-semibold" style={{ color: accentColor }}>Audience Insight: </span>
                                {audienceSummary || <span className="italic opacity-40">Add your audience insight...</span>}
                            </p>
                        </EditableField>
                    </div>
                )}
            </div>
        </section>
    );
}
