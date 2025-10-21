"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  function handleToggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn(
        "relative h-9 w-9 overflow-hidden rounded-full border border-border/60 bg-background/80 transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      aria-label={isDark ? "Activate light mode" : "Activate dark mode"}
      disabled={!mounted}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all",
          mounted ? (isDark ? "-translate-y-6 opacity-0" : "translate-y-0 opacity-100") : "opacity-0",
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all",
          mounted ? (isDark ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0") : "opacity-0",
        )}
        aria-hidden
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
