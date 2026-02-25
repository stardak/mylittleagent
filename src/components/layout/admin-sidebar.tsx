"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Users,
    TrendingUp,
    Tag,
    CreditCard,
    MessageSquare,
    ScrollText,
    ArrowLeft,
    LogOut,
    Shield,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const navigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Signups & Funnel", href: "/admin/signups", icon: TrendingUp },
    { name: "Discounts", href: "/admin/discounts", icon: Tag },
    { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
    { name: "Communications", href: "/admin/communications", icon: MessageSquare },
    { name: "Activity Log", href: "/admin/activity", icon: ScrollText },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
            {/* Header */}
            <div className="flex h-16 items-center gap-3 px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <Shield className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                        Admin Panel
                    </p>
                    <span className="text-xs text-gray-500">Platform Management</span>
                </div>
            </div>

            <Separator className="opacity-50" />

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive =
                        item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname?.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-4.5 w-4.5 shrink-0 transition-colors",
                                    isActive
                                        ? "text-indigo-600"
                                        : "text-gray-400 group-hover:text-gray-600"
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <Separator className="opacity-50" />

            {/* Bottom Actions */}
            <div className="p-3 space-y-1">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-4.5 w-4.5 text-gray-400" />
                    Back to App
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut className="h-4.5 w-4.5 text-gray-400" />
                    Sign Out
                </button>
                <div className="px-3 pt-2">
                    <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                </div>
            </div>
        </aside>
    );
}
