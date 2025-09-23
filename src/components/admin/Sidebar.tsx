"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, PlusCircle, LayoutDashboard } from "lucide-react";

export function Sidebar({ closeSidebar }: { closeSidebar?: () => void }) {
    const pathname = usePathname();

    const links = [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/dashboard/create-user", label: "Create User", icon: Users },
        { href: "/admin/dashboard/create-clinic", label: "Create Clinic", icon: PlusCircle },
    ];

    return (
        <aside className="h-full flex flex-col">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold text-green-600">Admin Panel</h1>
            </div>

            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => closeSidebar && closeSidebar()}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                                isActive &&
                                "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold"
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
