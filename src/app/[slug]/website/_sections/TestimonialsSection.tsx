"use client";

import { SectionProps } from "./WebsiteRenderer";
import { EditableField } from "@/components/website/EditableField";

export function TestimonialsSection({ testimonials, accentColor, headingFont, copyOverrides = {}, editMode, onEdit }: SectionProps) {
    if (testimonials.length === 0 && !editMode) return null;
    const sectionHeading = copyOverrides["testimonials.heading"] ?? "What brands say about working with me.";

    return (
        <section id="testimonials" className="py-24 md:py-32 bg-[#f9f8f6]">
            <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
                <div className="mb-16">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>Kind Words</p>
                    <EditableField field="testimonials.heading" value={sectionHeading} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block">
                        <h2 className="text-4xl md:text-5xl font-semibold text-[#1a1a1a] leading-tight max-w-3xl mx-auto" style={{ fontFamily: headingFont }}>{sectionHeading}</h2>
                    </EditableField>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                    {testimonials.slice(0, 6).map((t) => (
                        <div key={t.id} className="bg-white rounded-2xl p-8 shadow-sm flex flex-col">
                            <div className="text-4xl mb-4 font-serif leading-none" style={{ color: accentColor }}>&ldquo;</div>
                            <p className="text-[#1a1a1a]/80 leading-relaxed text-base flex-1 mb-6">{t.quote}</p>
                            <div className="flex items-center gap-3 pt-4 border-t border-[#1a1a1a]/5">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0" style={{ backgroundColor: accentColor }}>
                                    {t.authorName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-[#1a1a1a] text-sm">{t.authorName}</p>
                                    <p className="text-xs text-[#1a1a1a]/50">{t.authorTitle ? `${t.authorTitle}, ` : ""}{t.company}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
