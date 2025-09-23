"use client";

import { Sidebar } from "@/components/admin/Sidebar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar (responsive) */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 border-r shadow-md transition-transform lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <Sidebar closeSidebar={() => setSidebarOpen(false)} />
            </div>

            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Mobile top bar */}
                <header className="p-4 border-b flex items-center justify-between bg-white dark:bg-gray-800 lg:hidden">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-bold text-green-600">Admin</h1>
                    <div className="w-10" />
                </header>

                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
