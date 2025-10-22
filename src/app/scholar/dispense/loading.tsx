import ScholarLayout from "@/components/scholar/scholar-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScholarDispenseLoading() {
    return (
        <ScholarLayout
            title="Walk-in dispensing"
            description="Log medicines provided to community walk-ins and highlight the scholars assisting them."
            actions={<Skeleton className="h-10 w-28 rounded-xl" />}
        >
            <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6">
                <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                    <CardHeader className="space-y-2 border-b border-green-100/70">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        ))}
                        <div className="sm:col-span-2 flex justify-end">
                            <Skeleton className="h-10 w-44 rounded-xl" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                    <CardHeader className="space-y-2 border-b border-green-100/70">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-green-50 bg-white/80 p-4 shadow-sm"
                            >
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
        </ScholarLayout>
    );
}
