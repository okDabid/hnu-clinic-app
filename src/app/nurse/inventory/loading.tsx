import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NurseInventoryLoading() {
    return (
        <NurseLayout
            title="Inventory Management"
            description="Monitor clinic stocks, update batch details, and keep replenishments on track."
        >
            <section className="mx-auto w-full max-w-5xl space-y-8">
                <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card
                            key={index}
                            className="rounded-3xl border-primary/20 bg-white/90 shadow-sm"
                        >
                            <CardHeader className="space-y-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card className="flex flex-1 flex-col rounded-3xl border border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <Skeleton className="h-6 w-40" />
                        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                            <Skeleton className="h-10 w-full sm:w-72" />
                            <Skeleton className="h-10 w-full sm:w-44" />
                            <Skeleton className="h-10 w-full sm:w-48" />
                            <Skeleton className="h-10 w-full sm:w-32" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="overflow-x-auto">
                            <div className="min-w-full space-y-3">
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 rounded-2xl bg-primary/10/60 p-3 text-sm font-medium text-primary">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <Skeleton key={index} className="h-4 w-full" />
                                    ))}
                                </div>
                                {Array.from({ length: 7 }).map((_, rowIndex) => (
                                    <div
                                        key={rowIndex}
                                        className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 rounded-2xl border border-primary/15 bg-white/80 p-3 text-sm"
                                    >
                                        {Array.from({ length: 4 }).map((_, colIndex) => (
                                            <Skeleton key={colIndex} className="h-4 w-full" />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
