import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AppointmentPanelProps {
    icon: LucideIcon;
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
}

export function AppointmentPanel({
    icon: Icon,
    title,
    description,
    actions,
    children,
    className,
    contentClassName,
}: AppointmentPanelProps) {
    return (
        <Card className={cn("rounded-3xl border-green-100/80 bg-white/90 shadow-sm", className)}>
            <CardHeader className="flex flex-col gap-4 border-b border-green-100/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    <CardTitle className="flex items-center gap-3 text-xl text-green-700">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600/10 text-green-700">
                            <Icon className="h-5 w-5" />
                        </span>
                        {title}
                    </CardTitle>
                    {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
                </div>
                {actions ? <div className="flex flex-col gap-2 text-sm text-muted-foreground">{actions}</div> : null}
            </CardHeader>
            <CardContent className={cn("pt-6", contentClassName)}>{children}</CardContent>
        </Card>
    );
}
