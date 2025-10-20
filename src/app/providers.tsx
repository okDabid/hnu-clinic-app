"use client";

import { ReactNode, useEffect } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { Toaster, toast } from "sonner";
import { SWRConfig } from "swr";

import { fetchJsonWithRetry } from "@/lib/http";

/**
 * Monitors the session and signs out users whose accounts become inactive.
 */
function SessionWatcher() {
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user?.status === "Inactive") {
            toast.error("Your account has been deactivated. Logging out...");
            signOut({ callbackUrl: "/login" });
        }
    }, [session]);

    return null;
}

/**
 * Sets up global providers for authentication, toasts, and session feedback.
 */
export default function Providers({ children }: { children: ReactNode }) {
    useEffect(() => {
        const url = new URL(window.location.href);
        const params = url.searchParams;

        if (params.has("logout") && params.get("logout") === "success") {
            toast.success("You have been logged out successfully.", {
                position: "top-center",
                duration: 2500,
            });
            params.delete("logout");
            window.history.replaceState({}, "", url.toString());
        }

        if (params.has("login") && params.get("login") === "success") {
            toast.success("Welcome!", {
                position: "top-center",
                duration: 2500,
            });
            params.delete("login");
            window.history.replaceState({}, "", url.toString());
        }
    }, []);

    return (
        <SWRConfig
            value={{
                fetcher: (resource: string | [string, RequestInit], init?: RequestInit) => {
                    if (Array.isArray(resource)) {
                        const [url, requestInit] = resource;
                        return fetchJsonWithRetry(url, { ...requestInit, ...init }, { retries: 3, retryDelayMs: 350 });
                    }
                    return fetchJsonWithRetry(resource, init, { retries: 3, retryDelayMs: 350 });
                },
                dedupingInterval: 30_000,
                focusThrottleInterval: 20_000,
                errorRetryCount: 2,
                revalidateOnFocus: false,
            }}
        >
            <SessionProvider>
                {children}
                <Toaster richColors position="top-center" />
                <SessionWatcher /> {/* runs globally */}
            </SessionProvider>
        </SWRConfig>
    );
}
