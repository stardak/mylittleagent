"use client";

import { SectionProps } from "./WebsiteRenderer";
import { EditableField } from "@/components/website/EditableField";
import Image from "next/image";

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

export function FeaturedWorkSection({ caseStudies, accentColor, headingFont, copyOverrides = {}, editMode, onEdit }: SectionProps) {
    if (caseStudies.length === 0 && !editMode) return null;
    const sectionHeading = copyOverrides["work.heading"] ?? "Partnerships that delivered results.";

    return (
        <section id="work" className="py-24 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="mb-16">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>Featured Work</p>
                    <EditableField field="work.heading" value={sectionHeading} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block">
                        <h2 className="text-4xl md:text-5xl font-semibold text-[#1a1a1a] leading-tight" style={{ fontFamily: headingFont }}>{sectionHeading}</h2>
                    </EditableField>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {caseStudies.slice(0, 6).map((cs) => {
                        const ytId = getYouTubeId(cs.contentUrl);
                        return (
                            <div key={cs.id} className="group rounded-2xl border border-[#1a1a1a]/10 overflow-hidden hover:shadow-lg transition-all duration-300">
                                {ytId ? (
                                    /* YouTube embed — responsive 16:9 */
                                    <div className="aspect-video relative overflow-hidden bg-black">
                                        <iframe
                                            src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&color=white`}
                                            title={cs.brandName}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute inset-0 w-full h-full border-0"
                                        />
                                    </div>
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
                                    <p className="text-base font-semibold text-[#1a1a1a] mt-2">{cs.result}</p>
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
