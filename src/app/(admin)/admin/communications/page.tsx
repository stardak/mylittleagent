"use client";

import { useState } from "react";
import {
    MessageSquare,
    Send,
    Mail,
    FileText,
    Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const savedTemplates = [
    { id: "1", name: "Welcome Email", subject: "Welcome to My Little Agent! 🎉", preview: "Thanks for joining!", lastUsed: "2026-02-20" },
    { id: "2", name: "Feature Announcement", subject: "New: AI Agent Chat is here", preview: "We're excited to announce...", lastUsed: "2026-02-15" },
    { id: "3", name: "Pro Plan Promo", subject: "Upgrade to Pro — 20% off", preview: "Unlock all features...", lastUsed: "2026-02-10" },
];

const notifLog = [
    { id: "1", type: "broadcast", subject: "January Product Update", recipients: 156, sent: "2026-01-28", openRate: "64%" },
    { id: "2", type: "broadcast", subject: "New Year — 25% off Pro", recipients: 82, sent: "2026-01-02", openRate: "71%" },
    { id: "3", type: "system", subject: "Trial Expiry Reminder", recipients: 24, sent: "2026-02-18", openRate: "82%" },
];

export default function AdminCommunicationsPage() {
    const [segment, setSegment] = useState("all");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) { toast.error("Subject and body required"); return; }
        setSending(true);
        await new Promise((r) => setTimeout(r, 1500));
        toast.success(`Broadcast sent to ${segment} segment`);
        setSubject(""); setBody(""); setSending(false);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Communications</h1>
                <p className="text-sm text-gray-500 mt-1">Broadcast emails, templates, and logs</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <h2 className="text-sm font-semibold text-gray-900">Compose Broadcast</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Audience</label>
                            <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                                <option value="all">All Users</option>
                                <option value="trial">Trial Users</option>
                                <option value="pro">Pro Subscribers</option>
                                <option value="inactive">Inactive (30+ days)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Subject</label>
                            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Body</label>
                            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Email content..." rows={6} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none" />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button onClick={handleSend} disabled={sending || !subject || !body} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm">
                                <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" /> Templates</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {savedTemplates.map((t) => (
                            <button key={t.id} onClick={() => { setSubject(t.subject); setBody(t.preview); toast.info(`Loaded: ${t.name}`); }} className="w-full px-6 py-4 text-left hover:bg-gray-50/50">
                                <p className="text-sm font-medium text-gray-900">{t.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{t.subject}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /> Log</h2>
                </div>
                <table className="w-full">
                    <thead><tr className="border-b border-gray-50">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Recipients</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Open Rate</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Sent</th>
                    </tr></thead>
                    <tbody>
                        {notifLog.map((n) => (
                            <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-6 py-3.5 text-sm font-medium text-gray-900">{n.subject}</td>
                                <td className="px-6 py-3.5"><Badge variant="outline">{n.type}</Badge></td>
                                <td className="px-6 py-3.5 text-sm text-gray-600">{n.recipients}</td>
                                <td className="px-6 py-3.5 text-sm font-semibold text-green-600">{n.openRate}</td>
                                <td className="px-6 py-3.5 text-sm text-gray-500">{new Date(n.sent).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
