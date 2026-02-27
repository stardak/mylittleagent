"use client";

import { SectionProps } from "./WebsiteRenderer";

export function ServicesSection({ profile, accentColor, headingFont }: SectionProps) {
    const rateCard = profile?.rateCard as Record<string, unknown>[] | null;
    const categories = profile?.contentCategories ?? [];

    // Extract service names from rate card
    const services: { title: string; description?: string }[] = [];
    if (Array.isArray(rateCard)) {
        rateCard.slice(0, 9).forEach((item: Record<string, unknown>) => {
            if (item.title || item.name || item.service) {
                services.push({
                    title: String(item.title ?? item.name ?? item.service),
                    description: item.description ? String(item.description) : undefined,
                });
            }
        });
    }

    if (services.length === 0 && categories.length === 0) return null;

    const ICONS = [
        // Video
        <svg key="v" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
        // Image
        <svg key="i" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        // Star
        <svg key="s" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
        // Chart
        <svg key="c" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        // Megaphone
        <svg key="m" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
        // Shield
        <svg key="sh" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
        // Pen
        <svg key="p" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
        // Globe
        <svg key="g" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        // Heart
        <svg key="h" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    ];

    return (
        <section id="services" className="py-24 md:py-32 bg-[#f9f8f6]">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="mb-16">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>
                        What I Offer
                    </p>
                    <h2 className="text-4xl md:text-5xl font-semibold text-[#1a1a1a] leading-tight max-w-3xl" style={{ fontFamily: headingFont }}>
                        Full-service <span style={{ color: accentColor }}>creative production.</span>
                    </h2>
                </div>

                {services.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-16">
                        {services.map((service, i) => (
                            <div key={service.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 group-hover:text-white"
                                    style={{
                                        backgroundColor: accentColor + "1a",
                                        color: accentColor,
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLDivElement).style.backgroundColor = accentColor;
                                        (e.currentTarget as HTMLDivElement).style.color = "white";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLDivElement).style.backgroundColor = accentColor + "1a";
                                        (e.currentTarget as HTMLDivElement).style.color = accentColor;
                                    }}
                                >
                                    {ICONS[i % ICONS.length]}
                                </div>
                                <h3 className="font-semibold text-[#1a1a1a] mb-2">{service.title}</h3>
                                {service.description && (
                                    <p className="text-sm text-[#1a1a1a]/50 leading-relaxed">{service.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {categories.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 md:p-12">
                        <h3 className="text-xl font-semibold text-[#1a1a1a] mb-6" style={{ fontFamily: headingFont }}>Content Categories</h3>
                        <div className="flex flex-wrap gap-3">
                            {categories.map((cat: string) => (
                                <span
                                    key={cat}
                                    className="px-5 py-2.5 rounded-full text-sm text-[#1a1a1a]/70 hover:bg-opacity-100 transition-colors duration-300 cursor-default"
                                    style={{ backgroundColor: "#f0f0ee" }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLSpanElement).style.backgroundColor = accentColor + "1a";
                                        (e.currentTarget as HTMLSpanElement).style.color = accentColor;
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLSpanElement).style.backgroundColor = "#f0f0ee";
                                        (e.currentTarget as HTMLSpanElement).style.color = "";
                                    }}
                                >
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
