"use client";

import { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Provides a single theme controller for light and dark modes across the app.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    return (
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
        </NextThemesProvider>
    );
}
