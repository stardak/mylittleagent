"use client";

import { SectionProps } from "./WebsiteRenderer";

export function AboutSection({ profile, accentColor, headingFont }: SectionProps) {
    if (!profile?.bio && !profile?.keyDifferentiators) return null;

    const paragraphs = profile?.bio?.split("\n\n").filter(Boolean) ?? [];
    const differentiators = profile?.keyDifferentiators?.split("\n").filter(Boolean) ?? [];

    return (
        <section id="about" className="py-24 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <p
                            className="text-sm tracking-[0.25em] uppercase font-medium mb-4"
                            style={{ color: accentColor }}
                        >
                            About
                        </p>
                        <h2
                            className="text-4xl md:text-5xl font-semibold text-[#1a1a1a] mb-8 leading-tight"
                            style={{ fontFamily: headingFont }}
                        >
                            {profile?.tagline ?? "The Story Behind the Brand"}
                        </h2>

                        <div className="space-y-4 text-[#1a1a1a]/70 text-lg leading-relaxed">
                            {paragraphs.length > 0
                                ? paragraphs.map((p, i) => <p key={i}>{p}</p>)
                                : <p>{profile?.bio}</p>
                            }
                        </div>

                        {profile?.location && (
                            <div className="mt-8 flex items-center gap-2 text-sm text-[#1a1a1a]/50">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {profile.location}
                            </div>
                        )}
                    </div>

                    {differentiators.length > 0 && (
                        <div className="space-y-5">
                            <p
                                className="text-sm tracking-[0.25em] uppercase font-medium"
                                style={{ color: accentColor }}
                            >
                                What Sets Me Apart
                            </p>
                            {differentiators.map((d, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-[#1a1a1a]/80 text-base leading-relaxed">{d}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
