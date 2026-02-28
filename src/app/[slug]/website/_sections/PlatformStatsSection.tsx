"use client";

import { SectionProps } from "./WebsiteRenderer";
import { EditableField } from "@/components/website/EditableField";


const BASE = "https://cdn.jsdelivr.net/gh/gauravghongde/social-icons@master/SVG/Color";

/** Map platform type → exact filename in SVG/Color/ of gauravghongde/social-icons */
const PLATFORM_ICON_URL: Record<string, string> = {
    youtube: `${BASE}/Youtube.svg`,
    instagram: `${BASE}/Instagram.svg`,
    tiktok: `${BASE}/Tik Tok.svg`,
    facebook: `${BASE}/Facebook.svg`,
    twitter: `${BASE}/Twitter.svg`,
    x: `${BASE}/Twitter.svg`,
    linkedin: `${BASE}/LinkedIN.svg`,
    snapchat: `${BASE}/Snapchat.svg`,
    pinterest: `${BASE}/Pinterest.svg`,
    twitch: `${BASE}/Twitch.svg`,
    spotify: `${BASE}/Spotify.svg`,
    discord: `${BASE}/Discord.svg`,
    reddit: `${BASE}/Reddit.svg`,
    telegram: `${BASE}/Telegram.svg`,
    patreon: `${BASE}/Patreon.svg`,
};

function getPlatformIconUrl(type: string): string | null {
    const key = type.toLowerCase().replace(/[\s_-]+/g, "");
    return PLATFORM_ICON_URL[key] ?? null;
}


export function PlatformStatsSection({ platforms, accentColor, headingFont, copyOverrides = {}, editMode, onEdit }: SectionProps) {
    if (platforms.length === 0 && !editMode) return null;

    const combinedFollowers = platforms.reduce((sum, p) => sum + (p.followers ?? 0), 0);
    const sectionHeading = copyOverrides["stats.heading"] ?? "Audience that listens, watches and acts.";

    const formatNum = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M+`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
        return String(n);
    };

    return (
        <section id="stats" className="py-24 md:py-32 bg-[#f9f8f6]">
            <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
                <div className="mb-16">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>Our Reach</p>
                    <EditableField field="stats.heading" value={sectionHeading} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1a1a1a] mb-6 max-w-3xl mx-auto leading-tight" style={{ fontFamily: headingFont }}>
                            {sectionHeading}
                        </h2>
                    </EditableField>
                </div>

                {/* Platform cards — flex-wrap so they center naturally regardless of count */}
                <div className="flex flex-wrap justify-center gap-6 mb-16">
                    {platforms.slice(0, 6).map((platform) => {
                        const iconUrl = getPlatformIconUrl(platform.type);
                        return (
                            <div key={platform.id} className="bg-white rounded-2xl p-6 shadow-sm w-56 flex-shrink-0 text-left">
                                {/* Logo */}
                                <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center mb-5 overflow-hidden">
                                    {iconUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={iconUrl}
                                            alt={platform.displayName}
                                            className="w-6 h-6 object-contain"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-[#1a1a1a]/40">{platform.displayName.charAt(0)}</span>
                                    )}
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
                                    {platform.totalViews != null && platform.totalViews > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-[#1a1a1a]/60">Total Views</span>
                                            <span className="text-sm font-semibold text-[#1a1a1a]">{formatNum(platform.totalViews)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {combinedFollowers > 0 && (
                    <div className="relative rounded-3xl overflow-hidden text-center bg-[#1a1a1a]">
                        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at center, ${accentColor} 0%, transparent 70%)` }} />
                        <div className="relative z-10 py-14 px-8">
                            <p className="text-sm tracking-[0.25em] uppercase text-white/50 font-medium mb-4">Combined Reach</p>
                            <div className="text-6xl md:text-8xl font-semibold mb-3" style={{ color: accentColor, fontFamily: headingFont }}>{formatNum(combinedFollowers)}</div>
                            <p className="text-white/60 text-lg">across all platforms</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
