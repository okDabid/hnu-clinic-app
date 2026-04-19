"use client";

import { ReactNode, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, Menu, Search, type LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

    const avatarFallback = useMemo(() => {
        const [first = "", second = ""] = fullName.split(" ");
        const initials = `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
        return initials || fallbackInitials;
    }, [fullName, fallbackInitials]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6" aria-busy>
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

    const isActiveNav = (href: string) => {
        const matcher = isNavItemActive ?? ((itemHref: string, current: string) => current === itemHref);
        return matcher(href, pathname);
    };

    const navLinks = (
        <nav className="flex flex-col gap-2" aria-label={`${panelLabel} navigation`}>
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveNav(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        )}
                        onClick={() => setMobileOpen(false)}
                    >
                        <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")} />
                        <span className="truncate">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-muted/20">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/80 bg-white/95 p-4 shadow-sm backdrop-blur lg:block">
                <div className="flex h-full flex-col gap-6">
                    <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                        <Image
                            src="/clinic-illustration.svg"
                            alt="HNU Clinic emblem"
                            width={40}
                            height={40}
                            className="h-10 w-10 object-contain"
                        />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">{panelLabel}</p>
                            <p className="text-sm font-semibold text-primary">Care Operations</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-white p-3">{navLinks}</div>

                    <div className="mt-auto rounded-2xl border border-border/70 bg-white p-3">
                        <div className="mb-3 flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-primary/15">
                                <AvatarImage src={session?.user?.image ?? undefined} alt={fullName} />
                                <AvatarFallback className="bg-primary/15 text-primary">{avatarFallback}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
                                <p className="text-xs text-muted-foreground">Signed in</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full justify-start rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            {isLoggingOut ? "Signing out..." : "Logout"}
                        </Button>
                    </div>
                </div>
            </aside>

            <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
                <header className="sticky top-0 z-30 border-b border-border/70 bg-white/95 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-xl border-primary/20 text-primary hover:bg-primary/10 lg:hidden"
                                    aria-label={sheetAriaLabel}
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 max-w-[85vw] border-r border-primary/15 bg-white p-0">
                                <SheetHeader className="border-b border-primary/15 p-6">
                                    <SheetTitle className="text-left text-lg text-primary">{sheetTitle}</SheetTitle>
                                </SheetHeader>
                                <div className="space-y-4 p-6">{navLinks}</div>
                            </SheetContent>
                        </Sheet>

                        <div className="relative min-w-[220px] flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                aria-label="Search dashboard"
                                placeholder="Search patients, appointments, inventory..."
                                className="h-10 rounded-xl border-border/70 bg-muted/40 pl-9"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="relative h-10 w-10 rounded-xl border-border/70"
                            aria-label="Notifications"
                        >
                            <Bell className="h-4 w-4 text-primary" />
                            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px]">3</Badge>
                        </Button>

                        <div className="hidden items-center gap-2 rounded-xl border border-border/70 bg-white px-3 py-2 md:flex">
                            <Avatar className="h-8 w-8 border border-primary/15">
                                <AvatarImage src={session?.user?.image ?? undefined} alt={fullName} />
                                <AvatarFallback className="bg-primary/15 text-primary">{avatarFallback}</AvatarFallback>
                            </Avatar>
                            <p className="max-w-40 truncate text-sm font-medium text-foreground">{fullName}</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
                    <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">{panelLabel}</p>
                                <h1 className="text-2xl font-semibold text-primary md:text-3xl">{title}</h1>
                                {description ? <p className="max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">{actions}</div>
                        </div>
                    </section>
                    {children}
                </main>

                <footer className="px-4 pb-6 md:px-6 lg:px-8">
                    <div className="rounded-2xl border border-border/70 bg-white px-5 py-3 text-center text-sm text-muted-foreground shadow-sm">
                        {footerNote ?? (
                            <>
                                © {new Date().getFullYear()} HNU Clinic Health Record &amp; Appointment System – {panelLabel}
                            </>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
}
