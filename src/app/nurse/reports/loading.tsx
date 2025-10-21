import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NurseReportsLoading() {
    return (
        <NurseLayout
            title="Quarterly Reports"
            description="Generate patient and illness insights for any quarter to prepare compliance-ready summaries."
            actions={<Skeleton className="h-9 w-36 rounded-xl" />}
        >
            <section className="space-y-6">
                <Card className="rounded-3xl border-transparent bg-white/80 shadow-sm md:border-green-100/70">
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardHeader>
                </Card>

                <Card className="rounded-3xl border-green-100/70 bg-white/85 shadow-sm">
                    <CardHeader className="space-y-2 border-b border-green-100/70 pb-4">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-40 w-full rounded-2xl" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-28" />
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-green-100/70 bg-white/85 shadow-sm">
                    <CardHeader className="space-y-2 border-b border-green-100/70 pb-4">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="rounded-2xl border border-green-50 bg-white/80 p-4">
                                    <Skeleton className="mb-2 h-4 w-32" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
