"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace-context";
import { useSession, signOut } from "next-auth/react";
import {
    LayoutDashboard,
    GitBranch,
    Send,
    Megaphone,
    Calendar,
    FileText,
    Mail,
    BarChart3,
    Settings,
    LogOut,
    ChevronDown,
    Sparkles,
    User,
    CreditCard,
    Shield,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pipeline", href: "/pipeline", icon: GitBranch },
    { name: "Outreach", href: "/outreach", icon: Send },
    { name: "Campaigns", href: "/campaigns", icon: Megaphone },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Templates", href: "/templates", icon: Mail },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Media Card", href: "/media-card", icon: CreditCard },
    { name: "Rate Card", href: "/rate-card", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { workspaceName } = useWorkspace();
    const { data: session } = useSession();

    const initials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ?? "CM";

    const workspaceInitials = workspaceName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ?? "CO";

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/40 bg-sidebar">
            {/* Workspace Header */}
            <div className="flex h-16 items-center gap-3 px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-heading text-sm font-semibold">
                    {workspaceInitials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                        {workspaceName ?? "My Little Agent"}
                    </p>
                    <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-brand" />
                        <span className="text-xs text-muted-foreground">Pro Plan</span>
                    </div>
                </div>
            </div>

            <Separator className="opacity-50" />

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-brand/10 text-brand shadow-sm"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-4.5 w-4.5 shrink-0 transition-colors",
                                    isActive
                                        ? "text-brand"
                                        : "text-muted-foreground group-hover:text-foreground"
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <Separator className="opacity-50" />

            {/* User Profile */}
            <div className="p-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-brand/10 text-brand text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {session?.user?.name ?? "User"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {session?.user?.email ?? ""}
                                </p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        {(session as any)?.isAdmin && (
                            <>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin" className="cursor-pointer">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Admin Panel
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                Profile Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="text-destructive cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}
