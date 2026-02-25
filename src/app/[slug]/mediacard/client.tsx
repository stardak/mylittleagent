"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    MediaCardPreview,
    type MediaCardData,
} from "@/components/media-card/media-card-preview";
import { Loader2 } from "lucide-react";

export function MediaCardPublicPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [data, setData] = useState<MediaCardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!slug) return;
        fetch(`/api/public/media-card/${slug}`)
            .then((r) => {
                if (!r.ok) throw new Error("Not found");
                return r.json();
            })
            .then((d) => setData(d))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f7f6f3",
                }}
            >
                <Loader2 style={{ width: 32, height: 32, animation: "spin 1s linear infinite", color: "#94a3b8" }} />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f7f6f3",
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>
                        Media Card Not Found
                    </h1>
                    <p style={{ fontSize: 14, color: "#64748b" }}>
                        This creator hasn&apos;t set up their media card yet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                background: "linear-gradient(160deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)",
            }}
        >
            <MediaCardPreview
                data={data}
                theme="light"
                sections={{
                    platforms: true,
                    audience: true,
                    categories: true,
                    brandPartners: true,
                    testimonials: true,
                    portfolio: true,
                    contact: true,
                }}
            />
        </div>
    );
}
