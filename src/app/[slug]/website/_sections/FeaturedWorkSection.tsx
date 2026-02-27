"use client";

import { SectionProps } from "./WebsiteRenderer";
import Image from "next/image";

export function FeaturedWorkSection({ caseStudies, accentColor, headingFont }: SectionProps) {
    if (caseStudies.length === 0) return null;

    return (
        <section id="work" className="py-24 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="mb-16">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>
                        Featured Work
                    </p>
                    <h2 className="text-4xl md:text-5xl font-semibold text-[#1a1a1a] leading-tight" style={{ fontFamily: headingFont }}>
                        Partnerships that <span style={{ color: accentColor }}>delivered results.</span>
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {caseStudies.slice(0, 6).map((cs) => (
                        <div key={cs.id} className="group rounded-2xl border border-[#1a1a1a]/10 overflow-hidden hover:shadow-lg transition-all duration-300">
                            {cs.imageUrl ? (
                                <div className="aspect-video relative overflow-hidden bg-[#f0f0f0]">
                                    <Image
                                        src={cs.imageUrl}
                                        alt={cs.brandName}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video flex items-center justify-center text-[#1a1a1a]/20" style={{ backgroundColor: accentColor + "0d" }}>
                                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-[#1a1a1a]">{cs.brandName}</p>
                                        {cs.industry && (
                                            <p className="text-sm text-[#1a1a1a]/50">{cs.industry}</p>
                                        )}
                                    </div>
                                    {cs.featured && (
                                        <span
                                            className="text-xs px-2 py-1 rounded-full font-medium"
                                            style={{ backgroundColor: accentColor + "1a", color: accentColor }}
                                        >
                                            Featured
                                        </span>
                                    )}
                                </div>
                                <p className="text-base font-semibold text-[#1a1a1a] mb-2">{cs.result}</p>
                                {cs.description && (
                                    <p className="text-sm text-[#1a1a1a]/60 leading-relaxed line-clamp-3">{cs.description}</p>
                                )}
                                {cs.contentUrl && (
                                    <a
                                        href={cs.contentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 mt-4 text-sm font-medium hover:underline"
                                        style={{ color: accentColor }}
                                    >
                                        View Content
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
