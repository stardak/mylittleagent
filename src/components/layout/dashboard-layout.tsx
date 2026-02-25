"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AgentChatPanel } from "@/components/agent/agent-chat-panel";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [chatOpen, setChatOpen] = useState(false);
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

    // Restore panel state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("agent-panel-open");
        if (saved === "true") setChatOpen(true);
    }, []);

    // Check API key status on mount, when panel opens, and on window focus
    useEffect(() => {
        const checkKey = () => {
            fetch("/api/settings/api-key")
                .then((r) => r.json())
                .then((d) => setHasApiKey(d.hasKey ?? false))
                .catch(() => setHasApiKey(false));
        };

        checkKey();

        // Re-check when user returns to the tab (e.g. after saving key in settings)
        window.addEventListener("focus", checkKey);
        return () => window.removeEventListener("focus", checkKey);
    }, []);

    // Also re-check when the panel is opened
    useEffect(() => {
        if (chatOpen) {
            fetch("/api/settings/api-key")
                .then((r) => r.json())
                .then((d) => setHasApiKey(d.hasKey ?? false))
                .catch(() => setHasApiKey(false));
        }
    }, [chatOpen]);

    const toggleChat = () => {
        setChatOpen((prev) => {
            const next = !prev;
            localStorage.setItem("agent-panel-open", String(next));
            return next;
        });
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className={`flex-1 ml-64 transition-all duration-300 ${chatOpen && hasApiKey !== false ? "mr-[400px]" : ""}`}>
                <div className="h-full">{children}</div>
            </main>
            <div className="fixed right-0 top-0 z-40">
                <AgentChatPanel
                    isOpen={chatOpen}
                    onToggle={toggleChat}
                    hasApiKey={hasApiKey}
                />
            </div>
        </div>
    );
}
