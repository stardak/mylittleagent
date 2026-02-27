import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service — My Little Agent",
    description: "Terms and conditions for using the My Little Agent creator management platform.",
};

export default function TermsOfServicePage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-16 text-slate-800">
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-sm text-slate-500 mb-10">Last updated: 27 February 2026</p>

            <section className="prose prose-slate max-w-none space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-3">1. Acceptance</h2>
                    <p>
                        By creating an account or using My Little Agent (&ldquo;the Service&rdquo;), you
                        agree to be bound by these Terms of Service. If you do not agree, do not use the
                        Service.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">2. Description of service</h2>
                    <p>
                        My Little Agent is a business management platform for self-managed content creators.
                        It provides CRM, pipeline tracking, campaign management, invoicing, AI-assisted
                        outreach, and a public media card feature.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">3. Account responsibilities</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>You must be at least 18 years old to use the Service.</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                        <li>You are responsible for all activity that occurs under your account.</li>
                        <li>
                            You must not use the Service for unlawful purposes, to send spam, or to
                            harass others.
                        </li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">4. Your content</h2>
                    <p>
                        You retain ownership of all content you upload or create within the Service
                        (brand profiles, case studies, media cards, etc.). You grant us a limited,
                        non-exclusive licence to host and display your content solely to provide the Service.
                    </p>
                    <p className="mt-3">
                        You confirm that your content does not infringe any third-party intellectual
                        property rights and complies with applicable law.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">5. Public media card</h2>
                    <p>
                        When you share your public media card link, anyone with the link can view the
                        information you have chosen to display. You control what information is included
                        via your profile settings. We do not warrant that your media card will be
                        accessible at all times.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">6. Third-party API keys</h2>
                    <p>
                        You may connect third-party services (e.g. Anthropic) by providing API keys.
                        You are solely responsible for compliance with those providers&rsquo; terms of service
                        and any associated costs.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">7. Availability and changes</h2>
                    <p>
                        We aim for high availability but do not guarantee uninterrupted access. We reserve
                        the right to modify or discontinue features with reasonable notice. We will not
                        make material adverse changes to core functionality without notifying active users
                        at least 14 days in advance.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">8. Limitation of liability</h2>
                    <p>
                        To the maximum extent permitted by law, My Little Agent is provided &ldquo;as is&rdquo;
                        without warranties of any kind. We shall not be liable for indirect, incidental,
                        or consequential damages arising from your use of the Service.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">9. Governing law</h2>
                    <p>
                        These terms are governed by the laws of England and Wales. Any disputes shall be
                        subject to the exclusive jurisdiction of the courts of England and Wales.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
                    <p>
                        Questions about these terms? Email{" "}
                        <a href="mailto:hello@mylittleagent.co" className="text-pink-600 underline">
                            hello@mylittleagent.co
                        </a>.
                    </p>
                </div>
            </section>
        </main>
    );
}
