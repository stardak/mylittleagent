"use client";

import { SectionProps } from "./WebsiteRenderer";
import { EditableField } from "@/components/website/EditableField";
import { useState } from "react";
import { toast } from "sonner";

export function ContactSection({ profile, accentColor, headingFont, slug, copyOverrides = {}, editMode, onEdit }: SectionProps) {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const sectionHeading = copyOverrides["contact.heading"] ?? "Let's create something together.";
    const sectionSubtext = copyOverrides["contact.subtext"] ?? profile?.tagline ?? "Reach out and let's talk about how we can collaborate.";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editMode) return;
        setSending(true);
        try {
            const res = await fetch("/api/website/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, workspaceSlug: slug }),
            });
            if (res.ok) { setSent(true); setForm({ name: "", email: "", message: "" }); }
            else toast.error("Failed to send. Please try again.");
        } catch { toast.error("Failed to send."); }
        finally { setSending(false); }
    };

    return (
        <section id="contact" className="py-24 md:py-32 bg-[#0e0e0e]">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="max-w-2xl mx-auto text-center mb-16">
                    <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>Get In Touch</p>
                    <EditableField field="contact.heading" value={sectionHeading} editMode={editMode} onEdit={onEdit} accentColor={accentColor} wrapClassName="block mb-6">
                        <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight" style={{ fontFamily: headingFont }}>{sectionHeading}</h2>
                    </EditableField>
                    <EditableField field="contact.subtext" value={sectionSubtext} editMode={editMode} onEdit={onEdit} multiline accentColor={accentColor} wrapClassName="block">
                        <p className="text-lg text-white/60">{sectionSubtext}</p>
                    </EditableField>
                </div>

                {sent ? (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: accentColor }}>
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-white text-xl font-semibold">Message sent!</p>
                        <p className="text-white/50 mt-2">Thanks for reaching out. I'll get back to you soon.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs text-white/50 tracking-widest uppercase mb-2 block">Name</label>
                                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                                    disabled={editMode}
                                    placeholder="Your name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-default" />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 tracking-widest uppercase mb-2 block">Email</label>
                                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required type="email"
                                    disabled={editMode}
                                    placeholder="your@email.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-default" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-white/50 tracking-widest uppercase mb-2 block">Message</label>
                            <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required
                                disabled={editMode}
                                placeholder={editMode ? "Contact form (disabled in edit mode)" : "Tell me about your project..."}
                                rows={5}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none disabled:opacity-50 disabled:cursor-default" />
                        </div>
                        <button type="submit" disabled={sending || editMode}
                            className="w-full py-4 rounded-xl text-white font-medium tracking-wide transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: accentColor }}>
                            {sending ? "Sending..." : "Send Message"}
                        </button>
                        {editMode && <p className="text-center text-xs text-white/30">Contact form is disabled in edit mode</p>}
                    </form>
                )}
            </div>
        </section>
    );
}
