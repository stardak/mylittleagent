"use client";

import { SectionProps } from "./WebsiteRenderer";
import { EditableField } from "@/components/website/EditableField";
import Image from "next/image";
import { useState } from "react";

/** Extract YouTube video ID from any youtube.com or youtu.be URL */
function getYouTubeId(url: string | null | undefined): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
        /youtube\.com\/.*[?&]v=([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

/** Extract Instagram shortcode from a post or reel URL */
function getInstagramShortcode(url: string | null | undefined): string | null {
    if (!url) return null;
    const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
}

/** Click-to-play YouTube embed */
function YouTubeCard({ videoId, title, accentColor }: { videoId: string; title: string; accentColor: string }) {
    const [active, setActive] = useState(false);
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    if (active) {
        return (
            <div className="aspect-video relative overflow-hidden bg-black">
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                />
            </div>
        );
    }

    return (
        <button
            className="aspect-video relative overflow-hidden bg-black block w-full cursor-pointer group/yt"
            onClick={() => setActive(true)}
            aria-label={`Play ${title}`}
        >
            <Image
                src={thumbnail}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover/yt:scale-105"
                unoptimized
            />
            <div className="absolute inset-0 bg-black/30 group-hover/yt:bg-black/20 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 group-hover/yt:scale-110"
                    style={{ backgroundColor: accentColor }}
                >
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
        </button>
    );
}

/** Instagram iframe embed — works for posts, reels, and IGTV without any API key */
function InstagramCard({ shortcode, title }: { shortcode: string; title: string }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className="relative overflow-hidden bg-[#fafafa]" style={{ minHeight: 420 }}>
            {/* Instagram gradient placeholder while loading */}
            {!loaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#f09433] via-[#e6683c] via-30% via-[#dc2743] via-60% via-[#cc2366] to-[#bc1888]">
                    <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10 opacity-80">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <p className="text-white/70 text-xs">Loading Instagram post…</p>
                </div>
            )}
            <iframe
                src={`https://www.instagram.com/p/${shortcode}/embed/`}
                title={title}
                className="w-full border-0 transition-opacity duration-300"
                style={{ minHeight: 420, opacity: loaded ? 1 : 0 }}
                scrolling="no"
                allowTransparency
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}

export function FeaturedWorkSection({ caseStudies, accentColor, headingFont, copyOverrides = {}, editMode, onEdit }: SectionProps) {
    if (caseStudies.length === 0 && !editMode) return null;
    const sectionHeading = copyOverrides["work.heading"] ?? "Partnerships that delivered results.";

    return (
        <section id="work" className="py-24 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
                <div className="mb-16">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>Featured Work</p>
                    <EditableField field="work.heading" value={sectionHeading} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block">
                        <h2 className="text-4xl md:text-5xl font-semibold text-[#1a1a1a] leading-tight max-w-3xl mx-auto" style={{ fontFamily: headingFont }}>{sectionHeading}</h2>
                    </EditableField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                    {caseStudies.slice(0, 6).map((cs) => {
                        const ytId = getYouTubeId(cs.contentUrl);
                        const igShortcode = !ytId ? getInstagramShortcode(cs.contentUrl) : null;
                        return (
                            <div key={cs.id} className="group rounded-2xl border border-[#1a1a1a]/10 overflow-hidden hover:shadow-lg transition-all duration-300">
                                {ytId ? (
                                    <YouTubeCard videoId={ytId} title={cs.brandName} accentColor={accentColor} />
                                ) : igShortcode ? (
                                    <InstagramCard shortcode={igShortcode} title={cs.brandName} />
                                ) : cs.imageUrl ? (
                                    <div className="aspect-video relative overflow-hidden bg-[#f0f0f0]">
                                        <Image src={cs.imageUrl} alt={cs.brandName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ) : (
                                    <div className="aspect-video flex items-center justify-center text-[#1a1a1a]/20" style={{ backgroundColor: accentColor + "0d" }}>
                                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                                <div className="p-6">
                                    <p className="font-semibold text-[#1a1a1a]">{cs.brandName}</p>
                                    {cs.industry && <p className="text-sm text-[#1a1a1a]/50">{cs.industry}</p>}
                                    {cs.result && <p className="text-base font-semibold text-[#1a1a1a] mt-2">{cs.result}</p>}
                                    {cs.description && <p className="text-sm text-[#1a1a1a]/60 leading-relaxed mt-1 line-clamp-3">{cs.description}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
