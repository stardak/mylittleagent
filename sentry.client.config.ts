import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Capture 10% of transactions for performance monitoring in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Only enable in production and staging; silence in local dev
    enabled: !!process.env.SENTRY_DSN,

    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
});
