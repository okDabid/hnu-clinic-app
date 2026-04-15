import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingDisclaimerPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-linear-to-b from-primary/10 via-white to-primary/5 px-6 py-12 md:px-12">
            <Card className="w-full max-w-3xl rounded-3xl border-primary/20 bg-white/95 shadow-xl">
                <CardHeader className="space-y-3 text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-primary">Disclaimer</p>
                    <CardTitle className="text-2xl text-primary md:text-3xl">Before Proceeding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <p className="text-center text-base leading-relaxed text-muted-foreground md:text-lg">
                        This website is strictly for the capstone project purposes of Holy Name University (HNU) BSIT students for S.Y. 2024–2025; it is not an official website, nor is it affiliated with or linked to Holy Name University.
                    </p>
                    <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row">
                        <Link href="/home" className="w-full sm:w-auto">
                            <Button className="w-full rounded-xl bg-primary px-7 font-semibold hover:bg-primary/90">Yes, Proceed</Button>
                        </Link>
                        <Link href="https://www.hnu.edu.ph" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full rounded-xl border-primary/30 px-7 text-primary hover:bg-primary/5">
                                No, Exit
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
