import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NurseRecordsLoading() {
    return (
        <NurseLayout
            title="Patient records"
            description="Coordinate patient histories, capture consultation notes, and support physicians during follow-ups."
            actions={<Skeleton className="h-10 w-36 rounded-xl" />}
        >
            <div className="space-y-6">
                <section className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Card
                                key={index}
                                className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm"
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

                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-60" />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <Skeleton className="h-10 w-full max-w-md" />
                                <Skeleton className="h-10 w-40" />
                            </div>
                            <div className="space-y-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="rounded-2xl border border-green-50 bg-white/80 p-4"
                                    >
                                        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr]">
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-48" />
                                                <Skeleton className="h-4 w-40" />
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                            <div className="flex flex-wrap items-center justify-end gap-3">
                                                <Skeleton className="h-8 w-24" />
                                                <Skeleton className="h-8 w-24" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </NurseLayout>
    );
}
