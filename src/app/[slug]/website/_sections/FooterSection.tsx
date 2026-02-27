"use client";

import { SectionProps } from "./WebsiteRenderer";

export function FooterSection({ profile, platforms, accentColor, headingFont }: SectionProps) {
    const year = new Date().getFullYear();
    const socialPlatforms = platforms.filter((p) => p.handle).slice(0, 5);

    return (
        <footer className="bg-[#0a0a0a] border-t border-white/5 py-12">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <p
                            className="text-xl font-semibold text-white"
                            style={{ fontFamily: headingFont }}
                        >
                            {profile?.brandName ?? "Creator"}
                        </p>
                        {profile?.tagline && (
                            <p className="text-sm text-white/40 mt-1">{profile.tagline}</p>
                        )}
                    </div>

                    <nav className="flex items-center gap-6">
                        {["About", "Work", "Stats", "Services", "Contact"].map((link) => (
                            <a
                                key={link}
                                href={`#${link.toLowerCase()}`}
                                className="text-sm text-white/50 hover:text-white transition-colors"
                            >
                                {link}
                            </a>
                        ))}
                    </nav>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-white/30">
                        © {year} {profile?.brandName ?? "Creator"}. All rights reserved.
                    </p>
                    <p className="text-xs text-white/20">
                        Built with{" "}
                        <span style={{ color: accentColor }}>My Little Agent</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
