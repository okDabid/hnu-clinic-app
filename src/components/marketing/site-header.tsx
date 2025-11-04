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
        <header className="sticky top-0 z-50 w-full border-b border-green-100/70 bg-white/75 backdrop-blur supports-backdrop-filter:bg-white/75">
            <div className="hidden w-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-500 px-4 py-1 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white/90 shadow-sm md:block">
                Caring for the Holy Name University community · Weekday clinic hours: 8:00 AM – 5:00 PM
            </div>
            <div className="mx-auto w-full max-w-7xl px-4 py-2.5 md:px-8">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-green-200/70 bg-white/90 px-4 py-2 shadow-sm ring-1 ring-green-100/60 md:gap-6 md:px-6 md:py-3">
                    <Link
                        href="/"
                        className="group flex items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-green-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        onClick={closeMenu}
                    >
                        <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-green-100 bg-white shadow-sm transition group-hover:-translate-y-px group-hover:shadow-md md:h-12 md:w-12">
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

                    <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
                        {navigation.map((item) => {
                            const isActive = activeMap.get(item.href);

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "relative inline-flex items-center rounded-full px-3.5 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                                        isActive
                                            ? "bg-linear-to-r from-green-600 via-emerald-500 to-green-600 text-white shadow-md"
                                            : "text-slate-600 hover:bg-green-50 hover:text-green-700",
                                    )}
                                    aria-label={item.label}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        <Link href="/login" className="ml-1">
                            <Button className="rounded-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-500 px-6 py-2 text-sm font-semibold shadow-md transition hover:from-green-700 hover:via-emerald-600 hover:to-teal-600">
                                Login
                            </Button>
                        </Link>
                    </nav>

                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white p-2 text-green-600 shadow-sm transition hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                    >
                        {menuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {menuOpen ? (
                <div className="px-4 pb-6 md:hidden">
                    <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-2xl border border-green-200/70 bg-white/95 shadow-lg">
                        <div className="flex flex-col gap-1 p-4">
                            {navigation.map((item) => {
                                const isActive = activeMap.get(item.href);

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={cn(
                                            "rounded-xl px-3 py-2 text-base font-medium transition",
                                            isActive
                                                ? "bg-green-100 text-green-800"
                                                : "text-slate-700 hover:bg-green-50 hover:text-green-700",
                                        )}
                                        onClick={closeMenu}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                            <Link href="/login" onClick={closeMenu}>
                                <Button className="mt-3 w-full rounded-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-500 text-base font-semibold shadow-md hover:from-green-700 hover:via-emerald-600 hover:to-teal-600">
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
