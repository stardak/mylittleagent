"use client";

import { forwardRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export type MediaCardTheme = "light" | "dark" | "brand";

export interface MediaCardPlatform {
    type: string;
    handle: string;
    followers: number | null;
    avgViews: number | null;
    engagementRate: number | null;
    genderFemale?: number | null;
    ageRange1?: string | null;
    ageRange1Pct?: number | null;
    topCountry1?: string | null;
    topCountry1Pct?: number | null;
    demographics?: any;
}

export interface MediaCardTestimonial {
    quote: string;
    authorName: string;
    authorTitle: string | null;
    company: string;
}

export interface MediaCardPortfolioItem {
    brandName: string;
    result: string;
    resultMetric: string | null;
    description: string | null;
    imageUrl: string | null;
    contentUrl: string | null;
}

export interface MediaCardData {
    brand: {
        name: string;
        tagline: string | null;
        bio: string | null;
        location: string | null;
        contactEmail: string | null;
        website: string | null;
        logoUrl: string | null;
        heroImageUrl: string | null;
        primaryColor: string;
        contentCategories: string[];
        audienceSummary: string | null;
    };
    platforms: MediaCardPlatform[];
    brandPartners: string[];
    testimonials: MediaCardTestimonial[];
    portfolio: MediaCardPortfolioItem[];
    totals: {
        followers: number;
        avgEngagement: number;
        platformCount: number;
    };
}

export interface MediaCardSections {
    platforms: boolean;
    audience: boolean;
    categories: boolean;
    brandPartners: boolean;
    testimonials: boolean;
    portfolio: boolean;
    contact: boolean;
}

interface MediaCardPreviewProps {
    data: MediaCardData;
    theme: MediaCardTheme;
    sections: MediaCardSections;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number | null | undefined): string {
    if (n == null) return "—";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    return n.toLocaleString();
}

function platformLabel(type: string): string {
    const labels: Record<string, string> = {
        youtube: "YouTube",
        instagram: "Instagram",
        tiktok: "TikTok",
        twitter: "X",
        facebook: "Facebook",
        linkedin: "LinkedIn",
        podcast: "Podcast",
        blog: "Blog",
    };
    return labels[type.toLowerCase()] || type;
}

function platformEmoji(type: string): string {
    const emojis: Record<string, string> = {
        youtube: "🎬",
        instagram: "📸",
        tiktok: "🎵",
        twitter: "💬",
        facebook: "👥",
        linkedin: "💼",
        podcast: "🎙️",
        blog: "✍️",
    };
    return emojis[type.toLowerCase()] || "🌐";
}

function platformIconUrl(type: string): string | null {
    const urls: Record<string, string> = {
        youtube: "/social-icons/youtube.svg",
        instagram: "/social-icons/instagram.svg",
        tiktok: "/social-icons/tiktok.svg",
        twitter: "/social-icons/twitter.svg",
        facebook: "/social-icons/facebook.svg",
        linkedin: "/social-icons/linkedin.svg",
        blog: "/social-icons/blogger.svg",
        podcast: "/social-icons/spotify.svg",
    };
    return urls[type.toLowerCase()] || null;
}

// ── Theme Palettes ───────────────────────────────────────────────────────────

function getThemeStyles(theme: MediaCardTheme, brandColor: string) {
    switch (theme) {
        case "dark":
            return {
                containerBg: "#0c0c14",
                overlayGradient: "linear-gradient(180deg, transparent 0%, rgba(12,12,20,0.6) 40%, rgba(12,12,20,0.95) 70%, #0c0c14 100%)",
                cardBg: "rgba(255,255,255,0.04)",
                cardBorder: "rgba(255,255,255,0.08)",
                glassBg: "rgba(255,255,255,0.06)",
                glassBorder: "rgba(255,255,255,0.1)",
                text: "#f1f5f9",
                textSecondary: "#94a3b8",
                textMuted: "#64748b",
                accent: "#818cf8",
                accentGlow: "rgba(129,140,248,0.3)",
                statBg: "rgba(129,140,248,0.1)",
                statBorder: "rgba(129,140,248,0.2)",
                badge: "rgba(255,255,255,0.06)",
                badgeBorder: "rgba(255,255,255,0.1)",
                badgeText: "#cbd5e1",
                partnerBg: "rgba(129,140,248,0.08)",
                partnerBorder: "rgba(129,140,248,0.2)",
                partnerText: "#a5b4fc",
                divider: "rgba(255,255,255,0.06)",
                footerOverlay: "rgba(129,140,248,0.05)",
            };
        case "brand":
            return {
                containerBg: "#fafafa",
                overlayGradient: `linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.9) 65%, #fafafa 100%)`,
                cardBg: "rgba(255,255,255,0.8)",
                cardBorder: `${brandColor}18`,
                glassBg: "rgba(255,255,255,0.7)",
                glassBorder: `${brandColor}20`,
                text: "#1a1a2e",
                textSecondary: "#4a4a6a",
                textMuted: "#6b7280",
                accent: brandColor,
                accentGlow: `${brandColor}40`,
                statBg: `${brandColor}08`,
                statBorder: `${brandColor}18`,
                badge: `${brandColor}06`,
                badgeBorder: `${brandColor}15`,
                badgeText: brandColor,
                partnerBg: `${brandColor}08`,
                partnerBorder: `${brandColor}18`,
                partnerText: brandColor,
                divider: `${brandColor}12`,
                footerOverlay: `${brandColor}05`,
            };
        default: // light
            return {
                containerBg: "#ffffff",
                overlayGradient: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.4) 35%, rgba(255,255,255,0.95) 70%, #ffffff 100%)",
                cardBg: "rgba(255,255,255,0.8)",
                cardBorder: "rgba(0,0,0,0.06)",
                glassBg: "rgba(255,255,255,0.6)",
                glassBorder: "rgba(0,0,0,0.06)",
                text: "#0f172a",
                textSecondary: "#334155",
                textMuted: "#64748b",
                accent: "#6366f1",
                accentGlow: "rgba(99,102,241,0.3)",
                statBg: "rgba(99,102,241,0.06)",
                statBorder: "rgba(99,102,241,0.12)",
                badge: "rgba(0,0,0,0.03)",
                badgeBorder: "rgba(0,0,0,0.06)",
                badgeText: "#475569",
                partnerBg: "rgba(99,102,241,0.06)",
                partnerBorder: "rgba(99,102,241,0.12)",
                partnerText: "#6366f1",
                divider: "rgba(0,0,0,0.06)",
                footerOverlay: "rgba(99,102,241,0.03)",
            };
    }
}

// ── Component ────────────────────────────────────────────────────────────────

export const MediaCardPreview = forwardRef<HTMLDivElement, MediaCardPreviewProps>(
    function MediaCardPreview({ data, theme, sections }, ref) {
        const t = getThemeStyles(theme, data.brand.primaryColor);
        const hasHero = !!data.brand.heroImageUrl;

        return (
            <div
                ref={ref}
                style={{
                    width: 600,
                    background: t.containerBg,
                    borderRadius: 28,
                    overflow: "hidden",
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    color: t.text,
                    position: "relative",
                    boxShadow: "0 4px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
                }}
            >
                {/* ── Hero Image / Header Zone ───────────── */}
                <div style={{ position: "relative", height: hasHero ? 280 : 160 }}>
                    {hasHero ? (
                        <img
                            src={data.brand.heroImageUrl!}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                background: theme === "dark"
                                    ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)"
                                    : theme === "brand"
                                        ? `linear-gradient(135deg, ${data.brand.primaryColor}dd 0%, ${data.brand.primaryColor}99 50%, ${data.brand.primaryColor}66 100%)`
                                        : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
                            }}
                        />
                    )}
                    {/* Gradient overlay */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: t.overlayGradient,
                        }}
                    />
                    {/* Brand info overlay */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: "0 36px 24px",
                            textAlign: "center",
                        }}
                    >
                        {data.brand.logoUrl && (
                            <img
                                src={data.brand.logoUrl}
                                alt=""
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 16,
                                    objectFit: "cover",
                                    margin: "0 auto 12px",
                                    border: `3px solid ${t.containerBg}`,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                }}
                            />
                        )}
                        <h1
                            style={{
                                fontSize: 30,
                                fontWeight: 700,
                                fontFamily: "'Recoleta', Georgia, serif",
                                margin: 0,
                                lineHeight: 1.15,
                                color: t.text,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {data.brand.name}
                        </h1>
                        {data.brand.tagline && (
                            <p style={{ fontSize: 14, color: t.textSecondary, margin: "6px 0 0", lineHeight: 1.4 }}>
                                {data.brand.tagline}
                            </p>
                        )}
                        {data.brand.location && (
                            <p style={{ fontSize: 12, color: t.textMuted, margin: "5px 0 0" }}>
                                📍 {data.brand.location}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Content Body ───────────────────────── */}
                <div style={{ padding: "20px 32px 28px", display: "flex", flexDirection: "column", gap: 22 }}>
                    {/* ── Stats Row ──────────────────── */}
                    <div style={{ display: "flex", gap: 10 }}>
                        {[
                            { label: "Followers", value: data.totals.followers > 0 ? formatNumber(data.totals.followers) : "—" },
                            { label: "Engagement", value: data.totals.avgEngagement > 0 ? `${data.totals.avgEngagement}%` : "—" },
                            { label: "Platforms", value: data.totals.platformCount > 0 ? String(data.totals.platformCount) : "—" },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                style={{
                                    flex: 1,
                                    background: t.statBg,
                                    border: `1px solid ${t.statBorder}`,
                                    borderRadius: 16,
                                    padding: "14px 10px",
                                    textAlign: "center",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 24,
                                        fontWeight: 800,
                                        color: t.accent,
                                        fontFamily: "'Recoleta', Georgia, serif",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {stat.value}
                                </div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: t.textMuted,
                                        marginTop: 5,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                        fontWeight: 700,
                                    }}
                                >
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Platforms ────────────────────── */}
                    {sections.platforms && data.platforms.length > 0 && (
                        <div>
                            <SectionLabel color={t.textMuted}>Platforms</SectionLabel>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {data.platforms.map((p, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            background: t.glassBg,
                                            border: `1px solid ${t.glassBorder}`,
                                            borderRadius: 14,
                                            padding: "11px 14px",
                                        }}
                                    >
                                        {platformIconUrl(p.type) ? (
                                            <div style={{ display: 'flex', width: 24, height: 24, flexShrink: 0 }}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={platformIconUrl(p.type)!} alt={platformLabel(p.type)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: 20, lineHeight: 1 }}>{platformEmoji(p.type)}</span>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                                                {platformLabel(p.type)}
                                            </div>
                                            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
                                                {p.handle}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right", marginRight: 4 }}>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>
                                                {formatNumber(p.followers)}
                                            </div>
                                        </div>
                                        {p.engagementRate != null && (
                                            <div
                                                style={{
                                                    background: t.statBg,
                                                    border: `1px solid ${t.statBorder}`,
                                                    borderRadius: 10,
                                                    padding: "5px 10px",
                                                    fontSize: 12,
                                                    fontWeight: 800,
                                                    color: t.accent,
                                                }}
                                            >
                                                {p.engagementRate}%
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Audience ─────────────────────── */}
                    {sections.audience && data.brand.audienceSummary && (
                        <div>
                            <SectionLabel color={t.textMuted}>Audience</SectionLabel>
                            <div
                                style={{
                                    background: t.glassBg,
                                    border: `1px solid ${t.glassBorder}`,
                                    borderRadius: 14,
                                    padding: "13px 16px",
                                    fontSize: 12,
                                    lineHeight: 1.7,
                                    color: t.textSecondary,
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {data.brand.audienceSummary}
                            </div>
                        </div>
                    )}

                    {/* ── Categories ───────────────────── */}
                    {sections.categories && data.brand.contentCategories.length > 0 && (
                        <div>
                            <SectionLabel color={t.textMuted}>Content</SectionLabel>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {data.brand.contentCategories.map((cat) => (
                                    <span
                                        key={cat}
                                        style={{
                                            background: t.badge,
                                            border: `1px solid ${t.badgeBorder}`,
                                            borderRadius: 20,
                                            padding: "5px 13px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: t.badgeText,
                                            letterSpacing: "0.01em",
                                        }}
                                    >
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Brand Partners ───────────────── */}
                    {sections.brandPartners && data.brandPartners.length > 0 && (
                        <div>
                            <SectionLabel color={t.textMuted}>Worked With</SectionLabel>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {data.brandPartners.map((name) => (
                                    <span
                                        key={name}
                                        style={{
                                            background: t.partnerBg,
                                            border: `1px solid ${t.partnerBorder}`,
                                            borderRadius: 20,
                                            padding: "5px 13px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: t.partnerText,
                                        }}
                                    >
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Testimonials ────────────────── */}
                    {sections.testimonials && data.testimonials && data.testimonials.length > 0 && (
                        <div>
                            <SectionLabel color={t.textMuted}>Testimonials</SectionLabel>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {data.testimonials.map((testimonial, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            background: t.glassBg,
                                            border: `1px solid ${t.glassBorder}`,
                                            borderRadius: 14,
                                            padding: "14px 16px",
                                        }}
                                    >
                                        <div style={{
                                            fontSize: 22,
                                            lineHeight: 1,
                                            color: t.accent,
                                            marginBottom: 4,
                                            fontFamily: "Georgia, serif",
                                        }}>
                                            &ldquo;
                                        </div>
                                        <p style={{
                                            fontSize: 12,
                                            lineHeight: 1.6,
                                            color: t.textSecondary,
                                            margin: "0 0 10px 0",
                                            fontStyle: "italic",
                                        }}>
                                            {testimonial.quote}
                                        </p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: "50%",
                                                    background: `linear-gradient(135deg, ${t.accent}30, ${t.accent}60)`,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 11,
                                                    fontWeight: 800,
                                                    color: t.accent,
                                                }}
                                            >
                                                {testimonial.authorName.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: t.text, lineHeight: 1.3 }}>
                                                    {testimonial.authorName}
                                                </div>
                                                <div style={{ fontSize: 10, color: t.textMuted, lineHeight: 1.3 }}>
                                                    {[testimonial.authorTitle, testimonial.company].filter(Boolean).join(" · ")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Previous Work / Portfolio ────── */}
                    {sections.portfolio && data.portfolio && data.portfolio.length > 0 && (
                        <div>
                            <SectionLabel color={t.textMuted}>Previous Work</SectionLabel>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {data.portfolio.slice(0, 4).map((item, i) => {
                                    const hasLink = !!item.contentUrl;
                                    const Wrapper = hasLink ? "a" : "div";
                                    const wrapperProps = hasLink
                                        ? {
                                            href: item.contentUrl!,
                                            target: "_blank" as const,
                                            rel: "noopener noreferrer",
                                            style: {
                                                textDecoration: "none",
                                                color: "inherit",
                                                display: "block",
                                                background: t.glassBg,
                                                border: `1px solid ${t.glassBorder}`,
                                                borderRadius: 14,
                                                overflow: "hidden" as const,
                                                transition: "border-color 0.2s, box-shadow 0.2s",
                                                cursor: "pointer" as const,
                                            },
                                        }
                                        : {
                                            style: {
                                                background: t.glassBg,
                                                border: `1px solid ${t.glassBorder}`,
                                                borderRadius: 14,
                                                overflow: "hidden" as const,
                                            },
                                        };

                                    return (
                                        <Wrapper key={i} {...(wrapperProps as any)}>
                                            {/* Thumbnail or gradient placeholder */}
                                            <div
                                                style={{
                                                    height: 72,
                                                    background: item.imageUrl
                                                        ? `url(${item.imageUrl}) center/cover no-repeat`
                                                        : `linear-gradient(135deg, ${t.accent}18 0%, ${t.accent}08 100%)`,
                                                    display: item.imageUrl ? "block" : "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    position: "relative",
                                                }}
                                            >
                                                {!item.imageUrl && (
                                                    <span style={{ fontSize: 24, opacity: 0.4 }}>📷</span>
                                                )}
                                                {/* Link indicator badge */}
                                                {hasLink && (
                                                    <div
                                                        style={{
                                                            position: "absolute",
                                                            top: 6,
                                                            right: 6,
                                                            width: 22,
                                                            height: 22,
                                                            borderRadius: "50%",
                                                            background: "rgba(0,0,0,0.55)",
                                                            backdropFilter: "blur(8px)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <svg
                                                            width="11"
                                                            height="11"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#fff"
                                                            strokeWidth="2.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                            <polyline points="15 3 21 3 21 9" />
                                                            <line x1="10" y1="14" x2="21" y2="3" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ padding: "10px 12px" }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 3 }}>
                                                    {item.brandName}
                                                </div>
                                                {item.result && (
                                                    <div style={{
                                                        fontSize: 11,
                                                        fontWeight: 800,
                                                        color: t.accent,
                                                        marginBottom: 3,
                                                    }}>
                                                        {item.resultMetric ? `${item.result} ${item.resultMetric}` : item.result}
                                                    </div>
                                                )}
                                                {item.description && (
                                                    <div style={{
                                                        fontSize: 10,
                                                        color: t.textMuted,
                                                        lineHeight: 1.4,
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical" as const,
                                                        overflow: "hidden",
                                                    }}>
                                                        {item.description}
                                                    </div>
                                                )}
                                                {hasLink && (
                                                    <div
                                                        style={{
                                                            marginTop: 5,
                                                            fontSize: 9,
                                                            fontWeight: 700,
                                                            color: t.accent,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.06em",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 3,
                                                        }}
                                                    >
                                                        <svg
                                                            width="9"
                                                            height="9"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                        </svg>
                                                        View content
                                                    </div>
                                                )}
                                            </div>
                                        </Wrapper>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Footer ──────────────────────── */}
                    {sections.contact && (data.brand.contactEmail || data.brand.website) && (
                        <div
                            style={{
                                background: t.footerOverlay,
                                borderRadius: 14,
                                padding: "14px 18px",
                                display: "flex",
                                justifyContent: "center",
                                gap: 20,
                                flexWrap: "wrap",
                            }}
                        >
                            {data.brand.contactEmail && (
                                <span style={{ fontSize: 11, color: t.textMuted, display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                                    ✉️ {data.brand.contactEmail}
                                </span>
                            )}
                            {data.brand.website && (
                                <span style={{ fontSize: 11, color: t.textMuted, display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                                    🌐 {data.brand.website}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

// ── Sub-component ────────────────────────────────────────────────────────────

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <div
            style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color,
                marginBottom: 8,
            }}
        >
            {children}
        </div>
    );
}
