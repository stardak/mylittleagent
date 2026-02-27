import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow YouTube and Vimeo iframes to load within pages
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
          },
        ],
      },
    ];
  },
};


export default withSentryConfig(nextConfig, {
  // Sentry organisation + project (set via Vercel env vars or .env)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps to Sentry and strip them from the browser bundle
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Suppress noisy CLI output during builds
  silent: !process.env.CI,

  // Tunnel Sentry requests through /monitoring to bypass ad-blockers
  tunnelRoute: "/monitoring",

  // Automatically instrument Next.js server components and API routes
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
});
