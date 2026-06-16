import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BulletListCardProps {
    title: string;
    items: string[];
    className?: string;
}

export function BulletListCard({ title, items, className }: BulletListCardProps) {
    return (
        <Card className={`rounded-3xl border-primary/20 bg-white/80 shadow-sm ${className ?? ""}`}>
            <CardHeader>
                <CardTitle className="text-lg text-primary">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li key={item} className="flex items-start gap-2 rounded-2xl bg-primary/10 p-3">
                            <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
