"use client";

import { ReactNode, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronRight, LogOut, Menu, Sparkles, type LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

    const avatarFallback = useMemo(() => {
        const [first = "", second = ""] = fullName.split(" ");
        const initials = `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
        return initials || fallbackInitials;
    }, [fullName, fallbackInitials]);

    if (status === "loading") {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6" aria-busy>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.2),transparent_40%)]" />
                <p className="relative rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white/90 backdrop-blur">
                    Verifying your session…
                </p>
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

    const isActiveNav = (href: string) => {
        const matcher = isNavItemActive ?? ((itemHref: string, current: string) => current === itemHref);
        return matcher(href, pathname);
    };

    const navLinks = (
        <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveNav(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                            isActive
                                ? "border-primary/40 bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                : "border-primary/10 bg-white/80 text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
                        )}
                        onClick={() => setMobileOpen(false)}
                    >
                        <div className="flex items-center gap-3">
                            <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")} />
                            <span className="whitespace-nowrap">{item.label}</span>
                        </div>
                        <ChevronRight
                            className={cn(
                                "h-4 w-4 transition-transform group-hover:translate-x-0.5",
                                isActive ? "text-primary-foreground" : "text-primary/70",
                            )}
                        />
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="relative flex min-h-screen overflow-hidden bg-slate-100/80">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),transparent_30%)]" />
            <aside className="sticky left-0 top-0 hidden h-screen w-84 shrink-0 border-r border-slate-200/80 bg-white/75 p-6 backdrop-blur-xl lg:flex lg:flex-col">
                <TooltipProvider delayDuration={75}>
                    <div className="flex h-full flex-col gap-6">
                        <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-white/80 p-4 shadow-sm">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                                <Image
                                    src="/clinic-illustration.svg"
                                    alt="HNU Clinic Health Record & Appointment System emblem"
                                    width={30}
                                    height={30}
                                    className="h-7 w-7 object-contain"
                                />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">HNU Clinic</p>
                                <p className="text-sm font-semibold text-primary">Care Operations</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-primary/15 bg-white/80 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="h-12 w-12 border border-primary/20">
                                            <AvatarImage src={session?.user?.image ?? undefined} alt={fullName} />
                                            <AvatarFallback className="bg-primary/15 text-primary">{avatarFallback}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="bottom"
                                        hideArrow
                                        className="rounded-xl border border-primary/10 bg-white px-3 py-2 text-primary shadow-lg"
                                    >
                                        Active session
                                    </TooltipContent>
                                </Tooltip>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-primary">{fullName}</p>
                                    <p className="text-xs text-muted-foreground">Signed in</p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="mt-4 rounded-full bg-primary/10 text-primary">
                                <Sparkles className="mr-1 h-3.5 w-3.5" />
                                {panelLabel}
                            </Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-4">{navLinks}</div>

                        <Button
                            variant="outline"
                            className="w-full gap-2 rounded-2xl border-primary/25 bg-white text-primary hover:bg-primary/10"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? "Signing out..." : <><LogOut className="h-4 w-4" />Logout</>}
                        </Button>
                    </div>
                </TooltipProvider>
            </aside>

            <div className="relative flex min-h-screen min-w-0 flex-1 flex-col px-4 pb-8 pt-6 md:px-6 lg:px-10">
                <header className="sticky top-0 z-30 mb-6 rounded-3xl border border-white/70 bg-white/80 px-4 py-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl md:px-6">
                    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:justify-between">
                        <div className="min-w-0 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">{panelLabel}</p>
                            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
                            {description ? <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p> : null}
                        </div>

                        <div className="flex w-full flex-wrap items-center gap-3 self-start md:w-auto md:self-auto">
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
                                <SheetContent side="right" className="w-84 max-w-[90vw] border-l border-primary/15 bg-slate-50 p-0">
                                    <SheetHeader className="border-b border-primary/15 bg-white/90 p-6">
                                        <SheetTitle className="flex items-center gap-3 text-lg text-primary">
                                            <Menu className="h-5 w-5" />
                                            {sheetTitle}
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6">
                                        <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-white p-4">
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

                                        <Button className="w-full gap-2 rounded-xl" onClick={handleLogout} disabled={isLoggingOut}>
                                            {isLoggingOut ? "Signing out..." : <><LogOut className="h-4 w-4" />Logout</>}
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </header>

                <main className="flex-1 space-y-6">{children}</main>

                <footer className="mt-10 rounded-3xl border border-white/60 bg-white/70 px-6 py-4 text-center text-sm text-slate-600 shadow-sm backdrop-blur">
                    {footerNote ?? <>© {new Date().getFullYear()} HNU Clinic Health Record &amp; Appointment System – {panelLabel}</>}
                </footer>
            </div>
        </div>
    );
}
