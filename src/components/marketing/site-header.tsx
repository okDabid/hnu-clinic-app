"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

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

    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-green-100/70 bg-white/85 backdrop-blur supports-backdrop-filter:bg-white/70">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
                <div className="flex items-center gap-3">
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
                </div>

                <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
                    {navigation.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="inline-flex items-center text-slate-600 transition hover:text-green-700"
                            aria-label={item.label}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <Link href="/login">
                        <Button className="bg-green-600 hover:bg-green-700 shadow-sm">Login</Button>
                    </Link>
                </nav>

                <button
                    type="button"
                    className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                >
                    {menuOpen ? <XIcon className="w-6 h-6 text-green-600" /> : <MenuIcon className="w-6 h-6 text-green-600" />}
                </button>
            </div>

            {menuOpen ? (
                <div className="flex flex-col gap-3 bg-white/95 px-4 pb-5 md:hidden">
                    {navigation.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="rounded-lg px-2 py-2 text-slate-700 transition hover:bg-green-50 hover:text-green-700"
                            onClick={closeMenu}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <Link href="/login" onClick={closeMenu}>
                        <Button className="w-full bg-green-600 hover:bg-green-700">Login</Button>
                    </Link>
                </div>
            ) : null}
        </header>
    );
}
