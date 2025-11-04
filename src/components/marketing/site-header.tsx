"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

    const activeMap = useMemo(() => {
        const map = new Map<string, boolean>();

        navigation.forEach((item) => {
            const [hrefPath] = item.href.split("#");

            if (!hrefPath) {
                map.set(item.href, false);
                return;
            }

            if (hrefPath === "/") {
                map.set(item.href, pathname === "/");
                return;
            }

            map.set(
                item.href,
                pathname === hrefPath || (pathname.startsWith(hrefPath) && hrefPath !== "/"),
            );
        });

        return map;
    }, [navigation, pathname]);

    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/80">
            <div className="mx-auto w-full max-w-7xl px-4 py-2 md:px-8">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-2 shadow-sm ring-1 ring-slate-200/70 md:gap-6 md:px-6 md:py-3">
                    <Link
                        href="/"
                        className="group flex items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        onClick={closeMenu}
                    >
                        <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition group-hover:-translate-y-px group-hover:shadow-md md:h-12 md:w-12">
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
                            <span className="text-sm font-semibold text-slate-900 md:text-base">HNU Clinic</span>
                            <span className="text-xs font-medium text-slate-600 md:text-sm">
                                Health Record &amp; Appointment System
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-1.5 text-sm font-medium md:flex">
                        {navigation.map((item) => {
                            const isActive = activeMap.get(item.href);

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "relative inline-flex items-center rounded-full px-3.5 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                                        isActive
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                    )}
                                    aria-label={item.label}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        <Link href="/login" className="ml-2">
                            <Button className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700">
                                Login
                            </Button>
                        </Link>
                    </nav>

                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                    >
                        {menuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {menuOpen ? (
                <div className="md:hidden">
                    <div
                        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
                        aria-hidden="true"
                        onClick={closeMenu}
                    />
                    <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-7xl origin-top overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex flex-col gap-1 p-4">
                            {navigation.map((item) => {
                                const isActive = activeMap.get(item.href);

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={cn(
                                            "rounded-xl px-3 py-2 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                                            isActive
                                                ? "bg-slate-900 text-white shadow-sm"
                                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                                        )}
                                        onClick={closeMenu}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                            <Link href="/login" onClick={closeMenu}>
                                <Button className="mt-4 w-full rounded-full bg-slate-900 text-base font-semibold text-white shadow-sm transition hover:bg-slate-700">
                                    Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
