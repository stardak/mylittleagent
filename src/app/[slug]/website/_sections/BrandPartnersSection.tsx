"use client";

import { SectionProps } from "./WebsiteRenderer";
import { EditableField } from "@/components/website/EditableField";

export function BrandPartnersSection({ profile, accentColor, headingFont, copyOverrides = {}, editMode, onEdit }: SectionProps) {
    const brands = profile?.previousBrands ?? [];
    const sectionHeading = copyOverrides["partners.heading"] ?? "Brands I've worked with";
    if (brands.length === 0 && !editMode) return null;

    return (
        <section id="partners" className="py-20 bg-white border-y border-[#1a1a1a]/5">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="text-center mb-12">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-3" style={{ color: accentColor }}>Previous Partners</p>
                    <EditableField field="partners.heading" value={sectionHeading} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block">
                        <h2 className="text-2xl font-semibold text-[#1a1a1a]" style={{ fontFamily: headingFont }}>{sectionHeading}</h2>
                    </EditableField>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                    {brands.map((brand: string) => (
                        <div key={brand} className="px-6 py-3 rounded-full border border-[#1a1a1a]/10 text-sm font-medium text-[#1a1a1a]/70">{brand}</div>
                    ))}
                </div>
            </div>
        </section>
    );
}
