import ScholarLayout from "@/components/scholar/scholar-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScholarAccountLoading() {
    return (
        <ScholarLayout
            title="Account Management"
            description="Review your personal information, keep emergency contacts current, and manage your clinic credentials."
        >
            <section className="space-y-6">
                <Card className="rounded-3xl border border-green-100/70 bg-white/80 shadow-sm">
                    <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-4 w-40" />
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader className="space-y-3">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3">
                            <Skeleton className="h-10 w-28" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardContent>
                </Card>
            </section>
        </ScholarLayout>
    );
}
