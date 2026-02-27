"use client";

import { SectionProps } from "./WebsiteRenderer";
import { useEffect, useRef } from "react";

export function HeroSection({ profile, platforms, accentColor, headingFont, heroVideoUrl }: SectionProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const combinedFollowers = platforms.reduce((sum, p) => sum + (p.followers ?? 0), 0);
    const totalViews = platforms.reduce((sum, p) => sum + (p.totalViews ?? 0), 0);
    const yearsActive = profile?.website ? undefined : undefined;

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => { });
        }
    }, []);

    const formatNum = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M+`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
        return String(n);
    };

    const stats = [
        combinedFollowers > 0 && { label: "Combined Reach", value: formatNum(combinedFollowers) },
        totalViews > 0 && { label: "Total Views", value: formatNum(totalViews) },
        platforms.length > 0 && { label: "Platforms", value: String(platforms.length) },
    ].filter(Boolean) as { label: string; value: string }[];

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0e0e0e]">
            {/* Background */}
            <div className="absolute inset-0">
                {heroVideoUrl ? (
                    <video
                        ref={videoRef}
                        autoPlay loop muted playsInline
                        poster={profile?.heroImageUrl ?? undefined}
                        className="absolute inset-0 w-full h-full object-cover"
                    >
                        <source src={heroVideoUrl} type="video/mp4" />
                    </video>
                ) : profile?.heroImageUrl ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${profile.heroImageUrl})` }}
                    />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full py-32 md:py-40">
                <div className="max-w-2xl">
                    {/* Location badge */}
                    {profile?.location && (
                        <p
                            className="text-sm tracking-[0.25em] uppercase font-medium mb-6"
                            style={{ color: accentColor }}
                        >
                            {profile.location}
                        </p>
                    )}

                    {/* Name */}
                    <h1
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-white leading-[0.95] mb-6"
                        style={{ fontFamily: headingFont }}
                    >
                        {profile?.brandName?.toUpperCase() ?? "CREATOR"}
                    </h1>

                    {/* Tagline */}
                    {profile?.tagline && (
                        <p className="text-xl md:text-2xl text-white/80 font-light mb-6" style={{ fontFamily: headingFont }}>
                            {profile.tagline}
                        </p>
                    )}

                    {/* Bio intro */}
                    {profile?.bio && (
                        <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-lg">
                            {profile.bio.split("\n")[0]}
                        </p>
                    )}

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-4 mb-16">
                        <a
                            href="#contact"
                            className="inline-flex items-center gap-2 px-8 py-3.5 text-white text-sm tracking-widest uppercase rounded-full transition-all duration-300 hover:opacity-90"
                            style={{ backgroundColor: accentColor }}
                        >
                            Work With Me
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                        <a
                            href="#about"
                            className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/30 text-white text-sm tracking-widest uppercase rounded-full hover:border-white/60 transition-colors duration-300"
                        >
                            Learn More
                        </a>
                    </div>

                    {/* Stats */}
                    {stats.length > 0 && (
                        <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-xl">
                            {stats.map((stat) => (
                                <div key={stat.label}>
                                    <p className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: headingFont }}>
                                        {stat.value}
                                    </p>
                                    <p className="text-xs text-white/50 tracking-widest uppercase mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                    <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
                </div>
            </div>
        </section>
    );
}
