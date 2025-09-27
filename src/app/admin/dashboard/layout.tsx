"use client";

import { AdminSidebar } from "@/components/admin/Sidebar";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Shadcn Sidebar */}
                <AdminSidebar />

                {/* Main content */}
                <SidebarInset className="flex-1">
                    <header className="flex h-14 items-center gap-2 border-b bg-white dark:bg-gray-800 px-4">
                        <SidebarTrigger />
                    </header>
                    <main className="p-6">{children}</main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
