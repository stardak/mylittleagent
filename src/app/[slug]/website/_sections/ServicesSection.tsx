"use client";

import { SectionProps } from "./WebsiteRenderer";
import { EditableField } from "@/components/website/EditableField";

export function ServicesSection({ profile, accentColor, headingFont, copyOverrides = {}, editMode, onEdit }: SectionProps) {
    const rateCard = profile?.rateCard as Record<string, unknown>[] | null;
    const categories = profile?.contentCategories ?? [];
    const sectionHeading = copyOverrides["services.heading"] ?? "Full-service creative production.";

    const services: { title: string; description?: string }[] = [];
    if (Array.isArray(rateCard)) {
        rateCard.slice(0, 9).forEach((item: Record<string, unknown>) => {
            if (item.title || item.name || item.service) {
                services.push({ title: String(item.title ?? item.name ?? item.service), description: item.description ? String(item.description) : undefined });
            }
        });
    }

    if (services.length === 0 && categories.length === 0 && !editMode) return null;

    const ICONS = ["🎬", "📸", "⭐", "📊", "📣", "🛡", "✏️", "🌐", "💙"];

    return (
        <section id="services" className="py-24 md:py-32 bg-[#f9f8f6]">
            <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
                <div className="mb-16">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>What I Offer</p>
                    <EditableField field="services.heading" value={sectionHeading} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block">
                        <h2 className="text-4xl md:text-5xl font-semibold text-[#1a1a1a] leading-tight max-w-3xl mx-auto" style={{ fontFamily: headingFont }}>{sectionHeading}</h2>
                    </EditableField>
                </div>

                {services.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-16">
                        {services.map((service, i) => (
                            <div key={service.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-left">
                                <div className="text-2xl mb-4">{ICONS[i % ICONS.length]}</div>
                                <h3 className="font-semibold text-[#1a1a1a] mb-2">{service.title}</h3>
                                {service.description && <p className="text-sm text-[#1a1a1a]/50 leading-relaxed">{service.description}</p>}
                            </div>
                        ))}
                    </div>
                )}

                {categories.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 md:p-12">
                        <h3 className="text-xl font-semibold text-[#1a1a1a] mb-6" style={{ fontFamily: headingFont }}>Content Categories</h3>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {categories.map((cat: string) => (
                                <span key={cat} className="px-5 py-2.5 rounded-full text-sm text-[#1a1a1a]/70" style={{ backgroundColor: "#f0f0ee" }}>{cat}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
