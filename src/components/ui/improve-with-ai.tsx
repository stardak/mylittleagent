"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, RotateCcw } from "lucide-react";

interface ImproveWithAIProps {
    /** Current text value from the input */
    value: string;
    /** Called when AI returns improved text */
    onImproved: (text: string) => void;
    /** The type of field being improved — maps to server-side prompt context */
    fieldType: "bio" | "tagline" | "brief" | "result" | "audienceSummary" | "emailSignature" | "fitReason" | "generic";
    /** Optional additional context for the AI */
    context?: string;
    /** Whether the AI Manager is configured */
    disabled?: boolean;
    /** Custom label */
    label?: string;
}

export function ImproveWithAI({
    value,
    onImproved,
    fieldType,
    context,
    disabled = false,
    label = "Improve with AI",
}: ImproveWithAIProps) {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");
    const [previousValue, setPreviousValue] = useState<string | null>(null);

    if (disabled) return null;

    const handleImprove = async () => {
        if (!value || value.trim().length < 3) {
            setError("Type something first");
            setTimeout(() => setError(""), 2000);
            return;
        }

        setLoading(true);
        setError("");
        setPreviousValue(value);

        try {
            const res = await fetch("/api/ai/improve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: value, fieldType, context }),
            });

            if (!res.ok) {
                const err = await res.json();
                setError(err.error || "Failed to improve");
                return;
            }

            const data = await res.json();
            if (data.improved) {
                onImproved(data.improved);
                setDone(true);
                setTimeout(() => setDone(false), 3000);
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleUndo = () => {
        if (previousValue !== null) {
            onImproved(previousValue);
            setPreviousValue(null);
            setDone(false);
        }
    };

    return (
        <div className="flex items-center gap-1.5 mt-1">
            <button
                type="button"
                onClick={handleImprove}
                disabled={loading || !value || value.trim().length < 3}
                className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium
                    transition-all duration-200 cursor-pointer
                    ${loading
                        ? "bg-brand/10 text-brand/60"
                        : done
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : error
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-brand/5 text-brand hover:bg-brand/15 border border-brand/20 hover:border-brand/40"
                    }
                    disabled:opacity-40 disabled:cursor-not-allowed
                `}
            >
                {loading ? (
                    <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Improving...
                    </>
                ) : done ? (
                    <>
                        <Check className="h-3 w-3" />
                        Improved!
                    </>
                ) : error ? (
                    <>{error}</>
                ) : (
                    <>
                        <Sparkles className="h-3 w-3" />
                        {label}
                    </>
                )}
            </button>

            {/* Undo button after AI improvement */}
            {done && previousValue !== null && (
                <button
                    type="button"
                    onClick={handleUndo}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                        text-muted-foreground hover:text-foreground hover:bg-muted/60
                        transition-colors cursor-pointer"
                >
                    <RotateCcw className="h-3 w-3" />
                    Undo
                </button>
            )}
        </div>
    );
}
