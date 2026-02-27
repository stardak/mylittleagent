"use client";

import { SectionProps } from "./WebsiteRenderer";

export function BrandPartnersSection({ profile, accentColor, headingFont }: SectionProps) {
    const brands = profile?.previousBrands ?? [];
    if (brands.length === 0) return null;

    return (
        <section id="partners" className="py-20 bg-white border-y border-[#1a1a1a]/5">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="text-center mb-12">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-3" style={{ color: accentColor }}>
                        Previous Partners
                    </p>
                    <h2 className="text-2xl font-semibold text-[#1a1a1a]" style={{ fontFamily: headingFont }}>
                        Brands I&apos;ve worked with
                    </h2>
                </div>

                {/* Logo/Brand wall */}
                <div className="flex flex-wrap gap-4 justify-center">
                    {brands.map((brand: string) => (
                        <div
                            key={brand}
                            className="px-6 py-3 rounded-full border border-[#1a1a1a]/10 text-sm font-medium text-[#1a1a1a]/70 hover:border-current hover:text-current transition-all duration-300"
                            style={{ ["--hover-color" as string]: accentColor }}
                            onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLDivElement;
                                el.style.borderColor = accentColor;
                                el.style.color = accentColor;
                                el.style.backgroundColor = accentColor + "0d";
                            }}
                            onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLDivElement;
                                el.style.borderColor = "";
                                el.style.color = "";
                                el.style.backgroundColor = "";
                            }}
                        >
                            {brand}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
