"use client";

import { ReactNode, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Menu, type LucideIcon } from "lucide-react";

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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
            <div className="flex min-h-screen items-center justify-center bg-white p-6" aria-busy>
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
        <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveNav(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors",
                            "hover:bg-primary/10 hover:text-primary",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                            isActive ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "text-muted-foreground"
                        )}
                        onClick={() => setMobileOpen(false)}
                    >
                        <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-primary")} />
                        <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="relative flex min-h-screen bg-white">
            <aside className="sticky left-0 top-0 hidden h-screen w-16 flex-col items-center border-r border-primary/10 bg-white py-6 lg:flex">
                <TooltipProvider delayDuration={75}>
                    <div className="relative flex h-full w-full flex-col items-center gap-6 px-3">
                        <div className="flex h-12 w-12 items-center justify-center">
                            <Image
                                src="/clinic-illustration.svg"
                                alt="HNU Clinic Health Record & Appointment System emblem"
                                width={44}
                                height={44}
                                className="h-9 w-9 object-contain"
                            />
                        </div>

                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Avatar className="h-12 w-12 border border-primary/15">
                                    <AvatarImage src={session?.user?.image ?? undefined} alt={fullName} />
                                    <AvatarFallback className="bg-primary/15 text-primary">{avatarFallback}</AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent
                                side="right"
                                className="flex items-center gap-3 border-primary/10 bg-white px-3 py-2 text-primary shadow-lg"
                            >
                                <Avatar className="h-8 w-8 border border-primary/10 bg-primary/5">
                                    <AvatarImage src={session?.user?.image ?? undefined} alt={fullName} />
                                    <AvatarFallback className="bg-primary/15 text-primary">{avatarFallback}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-semibold leading-none">{fullName}</p>
                                    <p className="text-xs text-muted-foreground">Signed in</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>

                        <div className="flex-1 space-y-2 overflow-y-auto pb-4">
                            <nav className="flex flex-col items-center gap-3">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isActiveNav(item.href);

                                    return (
                                        <Tooltip key={item.href} delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "flex h-12 w-12 items-center justify-center rounded-2xl text-primary transition",
                                                        "hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                                                        isActive ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : ""
                                                    )}
                                                    aria-label={item.label}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="right"
                                                className="rounded-xl border border-primary/10 bg-white px-3 py-2 text-primary shadow-lg"
                                            >
                                                <p className="text-sm font-semibold leading-none">{item.label}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </nav>
                        </div>

                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-primary hover:bg-primary/10"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    aria-label="Logout"
                                >
                                    {isLoggingOut ? "…" : <LogOut className="h-5 w-5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="right"
                                className="rounded-xl border border-primary/10 bg-white px-3 py-2 text-primary shadow-lg"
                            >
                                <p className="text-sm font-semibold leading-none">Logout</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </aside>

            <div className="flex min-h-screen flex-1 flex-col px-4 pb-8 pt-6 md:px-6 lg:px-10">
                <header className="sticky top-0 z-30 mb-6 rounded-3xl border border-primary/15 bg-white px-4 py-4 shadow-sm md:px-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">{panelLabel}</p>
                            <h2 className="text-2xl font-semibold text-primary md:text-3xl">{title}</h2>
                            {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
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
                                <SheetContent side="right" className="w-80 max-w-[85vw] border-l border-primary/15 bg-white p-0">
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
                    {footerNote ?? (
                        <>
                            © {new Date().getFullYear()} HNU Clinic Health Record &amp; Appointment System – {panelLabel}
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
}
