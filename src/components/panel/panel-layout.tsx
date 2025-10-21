"use client";

import { ReactNode, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

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
    homeHref: string;
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
    homeHref,
    sheetAriaLabel,
    sheetTitle,
    fallbackInitials,
    isNavItemActive,
}: PanelLayoutProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const fullName = session?.user?.name ?? defaultName;

    const avatarFallback = useMemo(() => {
        const [first = "", second = ""] = fullName.split(" ");
        const initials = `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
        return initials || fallbackInitials;
    }, [fullName, fallbackInitials]);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
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
                            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                            "hover:bg-green-100/70 hover:text-green-700 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-green-50 dark:focus-visible:ring-emerald-400 dark:focus-visible:ring-offset-slate-950",
                            isActive && "bg-white text-green-700 shadow-sm dark:bg-slate-900/80 dark:text-emerald-300"
                        )}
                        onClick={() => setMobileOpen(false)}
                    >
                        <Icon
                            className={cn(
                                "h-4 w-4",
                                isActive ? "text-green-700 dark:text-emerald-300" : "text-gray-600 dark:text-slate-300"
                            )}
                        />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-6 md:flex-row md:gap-8 md:px-6 lg:px-8">
                <aside className="hidden w-72 shrink-0 flex-col rounded-3xl border border-green-100/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 lg:flex">
                    <div className="flex items-center gap-3 pb-6">
                        <Image
                            src="/clinic-illustration.svg"
                            alt="HNU Clinic"
                            width={44}
                            height={44}
                            className="h-11 w-11 object-contain drop-shadow"
                        />
                        <div>
                            <h1 className="text-xl font-bold text-green-700 dark:text-emerald-300">HNU Clinic</h1>
                        </div>
                    </div>
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                        <Avatar className="h-12 w-12 border border-green-100 dark:border-slate-700">
                            <AvatarImage src={session?.user?.image ?? undefined} alt={fullName} />
                            <AvatarFallback className="bg-green-200 text-green-800 dark:bg-emerald-900/50 dark:text-emerald-200">{avatarFallback}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs text-green-500 dark:text-emerald-300/80">Signed in as</p>
                            <p className="text-sm font-semibold text-green-700 dark:text-emerald-200">{fullName}</p>
                        </div>
                    </div>
                    {navLinks}
                    <Separator className="my-6" />
                    <Button
                        variant="default"
                        className="mt-auto w-full gap-2 rounded-xl bg-green-600 font-semibold text-white shadow-sm transition-transform hover:scale-[1.01] hover:bg-green-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
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
                </aside>

                <div className="flex flex-1 flex-col">
                    <header className="sticky top-0 z-30 mb-6 rounded-3xl border border-green-100/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800 dark:bg-slate-950/70 md:px-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-3">
                                <Link
                                    href={homeHref}
                                    className="flex items-center gap-3 rounded-2xl border border-green-100 bg-white/90 px-3 py-2 text-sm font-semibold text-green-700 shadow-sm transition hover:-translate-y-[1px] hover:bg-green-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-emerald-200 dark:hover:bg-emerald-900/40 lg:hidden"
                                >
                                    <Image
                                        src="/clinic-illustration.svg"
                                        alt="HNU Clinic"
                                        width={36}
                                        height={36}
                                        className="h-9 w-9 object-contain"
                                    />
                                    <span>HNU Clinic</span>
                                </Link>
                                <p className="text-xs font-semibold uppercase tracking-wider text-green-500 dark:text-emerald-300/80">{panelLabel}</p>
                                <h2 className="text-2xl font-semibold text-green-700 md:text-3xl dark:text-emerald-200">{title}</h2>
                                {description ? (
                                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground dark:text-slate-300">{description}</p>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-3 self-start md:self-auto">
                                <ThemeToggle size="sm" className="hidden md:inline-flex" />
                                {actions}
                                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/80 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:text-emerald-200 dark:hover:bg-emerald-900/40 dark:focus-visible:ring-emerald-400 dark:focus-visible:ring-offset-slate-950 lg:hidden"
                                            aria-label={sheetAriaLabel}
                                        >
                                            <Menu className="h-5 w-5" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="w-80 max-w-[85vw] border-l border-green-100 bg-gradient-to-b from-white to-green-50/60 p-0 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
                                        <SheetHeader className="border-b border-green-100 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-950/80">
                                            <SheetTitle className="flex items-center gap-3 text-lg text-green-700 dark:text-emerald-200">
                                                <Menu className="h-5 w-5" />
                                                {sheetTitle}
                                            </SheetTitle>
                                        </SheetHeader>
                                        <div className="space-y-6 px-6 py-6">
                                            <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                                                <Avatar className="h-11 w-11 border border-green-100 dark:border-slate-700">
                                                    <AvatarImage src={session?.user?.image ?? undefined} alt={fullName} />
                                                    <AvatarFallback className="bg-green-200 text-green-800 dark:bg-emerald-900/50 dark:text-emerald-200">{avatarFallback}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-xs text-green-500 dark:text-emerald-300/80">Signed in as</p>
                                                    <p className="text-sm font-semibold text-green-700 dark:text-emerald-200">{fullName}</p>
                                                </div>
                                            </div>
                                            {navLinks}
                                            <Button
                                                variant="default"
                                                className="w-full gap-2 rounded-xl bg-green-600 font-semibold text-white shadow-sm hover:bg-green-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
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

                    <footer className="mt-10 rounded-3xl border border-green-100/70 bg-white/80 px-6 py-4 text-center text-sm text-muted-foreground shadow-sm backdrop-blur">
                        {footerNote ?? <>
                            © {new Date().getFullYear()} HNU Clinic – {panelLabel}
                        </>}
                    </footer>
                </div>
            </div>
        </div>
    );
}
