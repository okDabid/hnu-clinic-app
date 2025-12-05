import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NurseAccountsLoading() {
    return (
        <NurseLayout
            title="Accounts Management"
            description="Create and manage user accounts, update your profile, and control access from one workspace."
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
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader className="space-y-3">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader className="space-y-3">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
