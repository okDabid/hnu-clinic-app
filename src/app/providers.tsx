"use client";

import { ReactNode, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster, toast } from "sonner";

export default function Providers({ children }: { children: ReactNode }) {
    useEffect(() => {
        const url = new URL(window.location.href);
        const params = url.searchParams;

        if (params.has("logout") && params.get("logout") === "success") {
            toast.success("You have been logged out successfully.", {
                position: "top-center",
                duration: 6000,
            });
            params.delete("logout");
            window.history.replaceState({}, "", url.toString());
        }

        if (params.has("login") && params.get("login") === "success") {
            toast.success("Welcome!", {
                position: "top-center",
                duration: 6000,
            });
            params.delete("login");
            window.history.replaceState({}, "", url.toString());
        }
    }, []);

    return (
        <SessionProvider>
            {children}
            <Toaster richColors position="top-center" />
        </SessionProvider>
    );
}
