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
        <header className="w-full sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-green-100">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-3">
                <div className="flex items-center gap-1">
                    <Link
                        href="/"
                        className="flex items-center gap-1 hover:opacity-90 transition-opacity"
                        onClick={closeMenu}
                    >
                        <Image
                            src="/clinic-illustration.svg"
                            alt="HNU Clinic logo"
                            width={48}
                            height={48}
                            priority
                            className="md:w-14 md:h-14"
                        />
                        <h1 className="text-lg md:text-2xl font-bold text-green-600 leading-none">HNU Clinic</h1>
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    {navigation.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-gray-700 hover:text-green-600 transition"
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
                    className="md:hidden p-2"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                >
                    {menuOpen ? <XIcon className="w-6 h-6 text-green-600" /> : <MenuIcon className="w-6 h-6 text-green-600" />}
                </button>
            </div>

            {menuOpen ? (
                <div className="flex flex-col gap-3 px-4 pb-5 md:hidden bg-white/95">
                    {navigation.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-gray-700 hover:text-green-600"
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
