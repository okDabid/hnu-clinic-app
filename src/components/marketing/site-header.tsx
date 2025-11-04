"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MenuIcon = dynamic(() => import("lucide-react").then((mod) => mod.Menu), {
    ssr: false,
});

const XIcon = dynamic(() => import("lucide-react").then((mod) => mod.X), {
    ssr: false,
});

export type SiteHeaderNavItem = {
    href: string;
    label: string;
};

export function SiteHeader({ navigation }: { navigation: SiteHeaderNavItem[] }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    const closeMenu = () => setMenuOpen(false);

    const isItemActive = (href: string) => {
        const [path] = href.split("#");
        if (!path) {
            return false;
        }

        return path === pathname;
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-green-100/70 bg-white/85 shadow-[0_12px_40px_-24px_rgba(16,185,129,0.55)] backdrop-blur supports-backdrop-filter:bg-white/70">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    className="group flex items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-green-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    onClick={closeMenu}
                >
                    <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-green-100/80 bg-white shadow-[0_8px_24px_rgba(16,185,129,0.15)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_32px_rgba(16,185,129,0.2)] md:h-12 md:w-12">
                        <Image
                            src="/clinic-illustration.svg"
                            alt="HNU Clinic Health Record & Appointment System emblem"
                            width={44}
                            height={44}
                            priority
                            className="h-9 w-9 object-contain md:h-10 md:w-10"
                        />
                    </span>
                    <div className="flex flex-col leading-tight text-left">
                        <span className="text-sm font-semibold text-green-700 md:text-base">HNU Clinic</span>
                        <span className="text-xs font-medium text-green-900 md:text-sm">
                            Health Record &amp; Appointment System
                        </span>
                    </div>
                </Link>

                <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
                    {navigation.map((item) => {
                        const active = isItemActive(item.href);

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                aria-label={item.label}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "inline-flex items-center rounded-full px-3 py-2 transition-colors",
                                    active
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-green-50 hover:text-green-700",
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                    <Link href="/login" aria-label="Login to HNU Clinic">
                        <Button className="ml-2 rounded-full bg-green-600 px-5 font-semibold shadow-sm transition hover:bg-green-700">
                            Login
                        </Button>
                    </Link>
                </nav>

                <button
                    type="button"
                    className="rounded-xl border border-green-100/80 bg-white/90 p-2 text-green-600 shadow-sm transition hover:border-green-200 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-expanded={menuOpen}
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                >
                    {menuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                </button>
            </div>

            {menuOpen ? (
                <div className="border-t border-green-100/80 bg-white/95 shadow-inner md:hidden">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 sm:px-6 lg:px-8">
                        <span className="text-xs font-semibold uppercase tracking-wide text-green-600/80">Navigate</span>
                        <div className="flex flex-col gap-2">
                            {navigation.map((item) => {
                                const active = isItemActive(item.href);

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={cn(
                                            "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                                            active
                                                ? "border-green-200 bg-green-600 text-white shadow-sm"
                                                : "border-green-100/80 bg-white/70 text-slate-700 hover:border-green-200 hover:bg-green-50 hover:text-green-700",
                                        )}
                                        onClick={closeMenu}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                        <Link href="/login" onClick={closeMenu}>
                            <Button className="mt-2 w-full rounded-full bg-green-600 py-2 text-sm font-semibold hover:bg-green-700">
                                Login
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
