import Link from "next/link";
import { ArrowUpRight, LucideIcon } from "lucide-react";

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
        <section className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-3", className)}>
            {actions.map(({ title: actionTitle, description, href, icon: Icon, cta }) => (
                <Card
                    key={actionTitle}
                    className="group h-full rounded-3xl border-white/70 bg-white/85 shadow-sm shadow-slate-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                    <CardHeader className="space-y-4">
                        <CardTitle className="flex items-start gap-3 text-lg text-slate-900">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                                <Icon className="h-5 w-5" />
                            </span>
                            <span>{actionTitle}</span>
                        </CardTitle>
                        <p className="text-sm font-normal leading-relaxed text-slate-600">{description}</p>
                    </CardHeader>
                    <CardContent>
                        <Button
                            asChild
                            variant="ghost"
                            className="h-10 rounded-xl border border-primary/20 bg-primary/5 px-3 text-sm font-semibold text-primary hover:bg-primary/15"
                        >
                            <Link href={href} className="inline-flex items-center gap-2">
                                {cta}
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
            <Card
                className={cn(
                    "h-full rounded-3xl border-0 bg-linear-to-br from-slate-900 via-slate-800 to-emerald-700 text-primary-foreground shadow-lg shadow-slate-900/30",
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
