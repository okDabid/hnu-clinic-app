"use client";

import { ReactNode, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, LogOut, Menu, type LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type PanelNavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
};

export type PanelLayoutContentProps = {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    footerNote?: ReactNode;
};

export type PanelLayoutProps = PanelLayoutContentProps & {
    navItems: readonly PanelNavItem[];
    panelLabel: string;
    defaultName: string;
    sheetAriaLabel: string;
    sheetTitle: string;
    fallbackInitials: string;
    isNavItemActive?: (href: string, pathname: string) => boolean;
};

export function PanelLayout({
    title,
    description,
    actions,
    children,
    footerNote,
    navItems,
    panelLabel,
    defaultName,
    sheetAriaLabel,
    sheetTitle,
    fallbackInitials,
    isNavItemActive,
}: PanelLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const hasRedirectedRef = useRef(false);
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            if (hasRedirectedRef.current) return;
            hasRedirectedRef.current = true;
            router.replace("/login");
        },
    });
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const fullName = session?.user?.name ?? defaultName;
    const [isCollapsed, setIsCollapsed] = useState(false);

    const avatarFallback = useMemo(() => {
        const [first = "", second = ""] = fullName.split(" ");
        const initials = `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
        return initials || fallbackInitials;
    }, [fullName, fallbackInitials]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary/10 via-white to-primary/5 p-6" aria-busy>
                <p className="text-sm font-medium text-muted-foreground">Verifying your session…</p>
            </div>
        );
    }

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            setMobileOpen(false);
            const data = await signOut({ redirect: false, callbackUrl: "/login" });
            hasRedirectedRef.current = true;
            if (data?.url) {
                router.replace(data.url);
            } else {
                router.replace("/login");
            }
        } finally {
            setIsLoggingOut(false);
        }
    }

    const navLinks = (
        <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const activeMatcher = isNavItemActive ?? ((href: string, current: string) => current === href);
                const isActive = activeMatcher(item.href, pathname);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                            "hover:bg-primary/10 hover:text-primary",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/10",
                            isCollapsed ? "justify-center" : "justify-start",
                            isActive ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "text-muted-foreground"
                        )}
                        onClick={() => setMobileOpen(false)}
                        title={item.label}
                        aria-label={item.label}
                    >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-primary")} />
                        <span
                            className={cn(
                                "truncate transition-[max-width,opacity] duration-200",
                                isCollapsed ? "max-w-0 opacity-0" : "max-w-[12rem] opacity-100"
                            )}
                        >
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="relative min-h-screen bg-linear-to-br from-primary/10 via-white to-primary/5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(34,197,94,0.12),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.1),transparent_25%)]" aria-hidden />
            <div className="relative flex min-h-screen w-full">
                <aside
                    className={cn(
                        "hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-primary/15 lg:bg-white/95 lg:shadow-sm lg:backdrop-blur",
                        "transition-[width,padding] duration-300 ease-in-out",
                        isCollapsed ? "w-20 px-4" : "w-72 px-6"
                    )}
                >
                    <div className="flex h-full flex-col">
                        <div className={cn("flex items-center gap-3 pb-6", isCollapsed ? "justify-center" : "justify-start")">
                            <span className="relative inline-flex h-11 w-11 items-center justify-center">
                                <Image
                                    src="/clinic-illustration.svg"
                                    alt="HNU Clinic Health Record & Appointment System emblem"
                                    width={44}
                                    height={44}
                                    className="h-9 w-9 object-contain"
                                />
                            </span>
                            <div
                                className={cn(
                                    "flex flex-col leading-tight text-left transition-[max-width,opacity] duration-200",
                                    isCollapsed ? "max-w-0 opacity-0" : "max-w-[14rem] opacity-100"
                                )}
                            >
                                <span className="text-sm font-semibold text-primary">HNU Clinic</span>
                                <span className="text-xs font-medium text-primary/80">
                                    Health Record &amp; Appointment System
                                </span>
                            </div>
                        </div>
                        <div
                            className={cn(
                                "mb-6 flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4",
                                isCollapsed ? "justify-center" : "justify-start"
                            )}
                        >
                            <Avatar className="h-12 w-12 border border-primary/15">
                                <AvatarImage src={session?.user?.image ?? undefined} alt={fullName} />
                                <AvatarFallback className="bg-primary/15 text-primary">{avatarFallback}</AvatarFallback>
                            </Avatar>
                            <div
                                className={cn(
                                    "transition-[max-width,opacity] duration-200",
                                    isCollapsed ? "max-w-0 opacity-0" : "max-w-[14rem] opacity-100"
                                )}
                            >
                                <p className="text-xs text-primary/80">Signed in as</p>
                                <p className="text-sm font-semibold text-primary">{fullName}</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1" aria-label={`${panelLabel} navigation`}>
                            {navLinks}
                        </div>
                        <div className="mt-6 space-y-3">
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-full justify-center rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                                onClick={() => setIsCollapsed((prev) => !prev)}
                                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            >
                                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                            </Button>
                            <Separator className="bg-primary/10" />
                            <Button
                                variant="default"
                                className="w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-primary/90"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    "Signing out..."
                                ) : (
                                    <>
                                        <LogOut className="h-4 w-4" />
                                        <span className="truncate">Logout</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </aside>

                <div className="flex flex-1 flex-col px-4 pb-10 pt-6 md:px-6 lg:px-10">
                    <header className="sticky top-0 z-30 mb-6 rounded-3xl border border-primary/15 bg-white/85 px-4 py-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-white/65 md:px-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">{panelLabel}</p>
                                <h2 className="text-2xl font-semibold text-primary md:text-3xl">{title}</h2>
                                {description ? (
                                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-3 self-start md:self-auto">
                                {actions}
                                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-xl border-primary/20 text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white lg:hidden"
                                            aria-label={sheetAriaLabel}
                                        >
                                            <Menu className="h-5 w-5" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="w-80 max-w-[85vw] border-l border-primary/15 bg-linear-to-b from-white to-primary/5 p-0">
                                        <SheetHeader className="border-b border-primary/15 bg-white/80 p-6">
                                            <SheetTitle className="flex items-center gap-3 text-lg text-primary">
                                                <Menu className="h-5 w-5" />
                                                {sheetTitle}
                                            </SheetTitle>
                                        </SheetHeader>
                                        <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6">
                                            <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                                <Avatar className="h-11 w-11 border border-primary/15">
                                                    <AvatarImage src={session?.user?.image ?? undefined} alt={fullName} />
                                                    <AvatarFallback className="bg-primary/15 text-primary">{avatarFallback}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-xs text-primary/80">Signed in as</p>
                                                    <p className="text-sm font-semibold text-primary">{fullName}</p>
                                                </div>
                                            </div>
                                            {navLinks}
                                            <Button
                                                variant="default"
                                                className="w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                            >
                                                {isLoggingOut ? (
                                                    "Signing out..."
                                                ) : (
                                                    <>
                                                        <LogOut className="h-4 w-4" />
                                                        Logout
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 space-y-6">{children}</main>

                    <footer className="mt-10 rounded-3xl border border-primary/15 bg-white/80 px-6 py-4 text-center text-sm text-muted-foreground shadow-sm backdrop-blur">
                        {footerNote ?? <>
                            © {new Date().getFullYear()} HNU Clinic Health Record &amp; Appointment System – {panelLabel}
                        </>}
                    </footer>
                </div>
            </div>
        </div>
    );
}
