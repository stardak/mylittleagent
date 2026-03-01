"use client";

import { SectionProps } from "./WebsiteRenderer";
import { EditableField } from "@/components/website/EditableField";

export function AboutSection({ profile, accentColor, headingFont, copyOverrides = {}, editMode, onEdit }: SectionProps) {
    const bio = copyOverrides["about.bio"] ?? profile?.bio ?? "";
    const heading = copyOverrides["about.heading"] ?? profile?.tagline ?? "The Story Behind the Brand";
    const paragraphs = bio.split("\n\n").filter(Boolean);
    const differentiators = (copyOverrides["about.differentiators"] ?? profile?.keyDifferentiators ?? "")
        .split("\n").filter(Boolean);

    if (!bio && !editMode) return null;

    return (
        <section id="about" className="py-24 md:py-32 bg-white">
            <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
                <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>About</p>

                <EditableField field="about.heading" value={heading} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block mb-8">
                    <h2 className="text-4xl md:text-5xl font-semibold text-[#1a1a1a] leading-tight" style={{ fontFamily: headingFont }}>
                        {heading}
                    </h2>
                </EditableField>

                <EditableField field="about.bio" value={bio} editMode={editMode} onEdit={onEdit} multiline accentColor={accentColor} wrapClassName="block mb-12">
                    <div className="space-y-4 text-[#1a1a1a]/70 text-lg leading-relaxed">
                        {paragraphs.length > 0
                            ? paragraphs.map((p, i) => <p key={i}>{p}</p>)
                            : <p className="italic opacity-40">Add your bio here...</p>}
                    </div>
                </EditableField>

                {profile?.location && (
                    <div className="mb-12 flex items-center justify-center gap-2 text-sm text-[#1a1a1a]/50">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {profile.location}
                    </div>
                )}


            </div>
        </section>
    );
}
