import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OverviewMetric = {
    label: string;
    value: string;
    trend: string;
};

type OverviewMetricsProps = {
    metrics: OverviewMetric[];
};

export function OverviewMetrics({ metrics }: OverviewMetricsProps) {
    return (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((stat) => (
                <Card key={stat.label} className="rounded-2xl border-border/70 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold text-primary">{stat.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{stat.trend}</p>
                    </CardContent>
                </Card>
            ))}
        </section>
    );
}
