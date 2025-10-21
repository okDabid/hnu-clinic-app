import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NurseInventoryLoading() {
    return (
        <NurseLayout
            title="Inventory Management"
            description="Monitor clinic stocks, update batch details, and keep replenishments on track."
        >
            <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-10 px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
                <Card className="flex flex-1 flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm">
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
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 rounded-2xl bg-green-50/60 p-3 text-sm font-medium text-green-700">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <Skeleton key={index} className="h-4 w-full" />
                                    ))}
                                </div>
                                {Array.from({ length: 7 }).map((_, rowIndex) => (
                                    <div
                                        key={rowIndex}
                                        className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 rounded-2xl border border-green-50 bg-white/80 p-3 text-sm"
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
