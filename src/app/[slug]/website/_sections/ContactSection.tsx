"use client";

import { SectionProps } from "./WebsiteRenderer";
import { useState } from "react";

export function ContactSection({ profile, platforms, accentColor, headingFont, slug }: SectionProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("sending");
        try {
            const res = await fetch("/api/website/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message, workspaceSlug: slug }),
            });
            if (res.ok) {
                setStatus("sent");
                setName(""); setEmail(""); setMessage("");
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    const socialPlatforms = platforms.filter((p) => p.handle);

    const getPlatformUrl = (type: string, handle: string) => {
        const t = type.toLowerCase();
        const h = handle.replace("@", "");
        if (t.includes("youtube")) return `https://youtube.com/${h}`;
        if (t.includes("instagram")) return `https://instagram.com/${h}`;
        if (t.includes("tiktok")) return `https://tiktok.com/@${h}`;
        return handle;
    };

    return (
        <section id="contact" className="py-24 md:py-32 bg-[#0e0e0e]">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="grid lg:grid-cols-2 gap-16">
                    {/* Left */}
                    <div>
                        <p className="text-sm tracking-[0.25em] uppercase font-medium mb-4" style={{ color: accentColor }}>
                            Get In Touch
                        </p>
                        <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 leading-tight" style={{ fontFamily: headingFont }}>
                            Let&apos;s create something <span style={{ color: accentColor }}>together.</span>
                        </h2>
                        <p className="text-white/60 text-lg leading-relaxed mb-10">
                            Got a partnership idea, brand collaboration, or just want to say hello?
                            I&apos;d love to hear from you.
                        </p>

                        {profile?.contactEmail && (
                            <a
                                href={`mailto:${profile.contactEmail}`}
                                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-8"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {profile.contactEmail}
                            </a>
                        )}

                        {/* Social links */}
                        {socialPlatforms.length > 0 && (
                            <div className="flex gap-4">
                                {socialPlatforms.slice(0, 5).map((p) => (
                                    <a
                                        key={p.id}
                                        href={getPlatformUrl(p.type, p.handle)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-current hover:text-white transition-all duration-300"
                                        style={{ ["--hover" as string]: accentColor }}
                                        title={p.displayName}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right - Form */}
                    <div className="bg-white/5 rounded-3xl p-8">
                        {status === "sent" ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: accentColor }}>
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-white text-xl font-semibold mb-2">Message Sent!</h3>
                                <p className="text-white/60">Thank you for reaching out. I&apos;ll get back to you soon.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Your Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Jane Smith"
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-current transition-colors"
                                        style={{ ["--focus-color" as string]: accentColor }}
                                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = accentColor; }}
                                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = ""; }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="jane@brand.com"
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none transition-colors"
                                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = accentColor; }}
                                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = ""; }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Your Message</label>
                                    <textarea
                                        required
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={5}
                                        placeholder="Tell me about your brand and what you have in mind..."
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none resize-none transition-colors"
                                        onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = accentColor; }}
                                        onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = ""; }}
                                    />
                                </div>
                                {status === "error" && (
                                    <p className="text-red-400 text-sm">Failed to send. Please try emailing directly.</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={status === "sending"}
                                    className="w-full py-4 rounded-xl text-white font-medium tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {status === "sending" ? "Sending..." : "Send Message →"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
