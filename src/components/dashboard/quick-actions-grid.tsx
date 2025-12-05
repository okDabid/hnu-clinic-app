import Link from "next/link";
import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickAction {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    cta: string;
}

interface HighlightCardProps {
    title: string;
    icon: LucideIcon;
    description: string[];
    className?: string;
}

interface QuickActionsGridProps {
    actions: QuickAction[];
    highlight: HighlightCardProps;
    className?: string;
}

export function QuickActionsGrid({ actions, highlight, className }: QuickActionsGridProps) {
    const { title, icon: HighlightIcon, description: highlightDescription, className: highlightClassName } = highlight;

    return (
        <section
            className={cn(
                "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:auto-rows-fr",
                className
            )}
        >
            {actions.map(({ title: actionTitle, description, href, icon: Icon, cta }) => (
                <Card
                    key={actionTitle}
                    className="h-full rounded-3xl border-primary/20 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-3 text-lg text-primary">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                </span>
                                {actionTitle}
                            </CardTitle>
                            <p className="text-sm font-normal text-muted-foreground">{description}</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="ghost" className="rounded-xl bg-primary/10 px-3 text-sm font-semibold text-primary hover:bg-primary/20">
                            <Link href={href}>{cta}</Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
            <Card
                className={cn(
                    "h-full rounded-3xl border-primary/20 bg-linear-to-br from-primary via-emerald-500 to-emerald-400 text-primary-foreground shadow-md",
                    highlightClassName,
                )}
            >
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                            <HighlightIcon className="h-5 w-5" />
                        </span>
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed text-white/90">
                    {highlightDescription.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </CardContent>
            </Card>
        </section>
    );
}
