import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NurseDispenseLoading() {
    return (
        <NurseLayout
            title="Dispense Records"
            description="Monitor dispensed medicines and review batch usage for accurate stock tracking."
        >
            <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col space-y-8 px-4 py-6 sm:px-6 sm:py-8">
                <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader className="border-b border-green-100/60">
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col pt-4">
                        <div className="overflow-x-auto">
                            <div className="min-w-full space-y-3">
                                <div className="grid grid-cols-8 gap-3 rounded-2xl bg-green-50/60 p-3 text-sm font-medium text-green-700">
                                    {Array.from({ length: 8 }).map((_, index) => (
                                        <Skeleton key={index} className="h-4 w-full" />
                                    ))}
                                </div>
                                {Array.from({ length: 6 }).map((_, rowIndex) => (
                                    <div
                                        key={rowIndex}
                                        className="grid grid-cols-8 gap-3 rounded-2xl border border-green-50 bg-white/80 p-3 text-sm"
                                    >
                                        {Array.from({ length: 8 }).map((_, colIndex) => (
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
