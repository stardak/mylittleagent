import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy — My Little Agent",
    description: "How My Little Agent collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-16 text-slate-800">
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-sm text-slate-500 mb-10">Last updated: 27 February 2026</p>

            <section className="prose prose-slate max-w-none space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-3">1. Who we are</h2>
                    <p>
                        My Little Agent (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is a creator
                        business management platform operated from the United Kingdom. Our website is{" "}
                        <a href="https://www.mylittleagent.co" className="text-pink-600 underline">
                            www.mylittleagent.co
                        </a>.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">2. Data we collect</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Account information</strong> — name, email address, and profile image
                            provided via Google OAuth or email/password sign-up.
                        </li>
                        <li>
                            <strong>Creator profile data</strong> — brand name, bio, platform handles,
                            follower counts, rate card, case studies, and testimonials you enter during
                            onboarding.
                        </li>
                        <li>
                            <strong>Usage data</strong> — pages visited, features used, and error logs
                            (collected via Sentry for debugging).
                        </li>
                        <li>
                            <strong>API keys</strong> — if you provide a third-party API key (e.g. Anthropic),
                            it is encrypted at rest using AES-256-GCM and never transmitted in plain text.
                        </li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">3. How we use your data</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>To provide, personalise, and improve the platform.</li>
                        <li>To generate your public media card (shared only at your request via your unique link).</li>
                        <li>To send transactional emails (password resets, Gmail OAuth flow).</li>
                        <li>To detect and fix bugs and errors.</li>
                    </ul>
                    <p className="mt-3">
                        We do <strong>not</strong> sell your personal data to third parties, use it for
                        advertising, or share it with anyone except the sub-processors listed below.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">4. Sub-processors</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Vercel</strong> — hosting and serverless functions (USA/EU)</li>
                        <li><strong>Neon / Supabase</strong> — managed PostgreSQL database</li>
                        <li><strong>Vercel Blob</strong> — image storage</li>
                        <li><strong>Google</strong> — OAuth authentication</li>
                        <li><strong>Sentry</strong> — error tracking</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">5. Data retention</h2>
                    <p>
                        We retain your data for as long as your account is active. You may request deletion
                        at any time by emailing{" "}
                        <a href="mailto:hello@mylittleagent.co" className="text-pink-600 underline">
                            hello@mylittleagent.co
                        </a>. We will delete your account and all associated data within 30 days.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">6. Your rights (GDPR)</h2>
                    <p>If you are in the UK or EU you have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Access the personal data we hold about you</li>
                        <li>Correct inaccurate data</li>
                        <li>Request erasure (&ldquo;right to be forgotten&rdquo;)</li>
                        <li>Object to or restrict processing</li>
                        <li>Data portability</li>
                    </ul>
                    <p className="mt-3">
                        To exercise any of these rights, contact us at{" "}
                        <a href="mailto:hello@mylittleagent.co" className="text-pink-600 underline">
                            hello@mylittleagent.co
                        </a>.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
                    <p>
                        We use a single session cookie for authentication (NextAuth.js). We do not use
                        advertising or tracking cookies.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">8. Changes to this policy</h2>
                    <p>
                        We may update this policy from time to time. Material changes will be communicated
                        via email or an in-app notice at least 14 days before they take effect.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
                    <p>
                        Questions? Email{" "}
                        <a href="mailto:hello@mylittleagent.co" className="text-pink-600 underline">
                            hello@mylittleagent.co
                        </a>.
                    </p>
                </div>
            </section>
        </main>
    );
}
