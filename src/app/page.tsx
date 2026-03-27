import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function DisclaimerPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-linear-to-b from-primary/10 via-white to-primary/5 px-4 py-8">
            <Card className="w-full max-w-2xl border-primary/20 shadow-lg">
                <CardHeader className="space-y-3 text-center">
                    <CardTitle className="text-2xl text-primary md:text-3xl">Disclaimer</CardTitle>
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                        This website is strictly for the capstone project purposes of Holy Name University (HNU) BSIT students for S.Y. 2024–2025; it is not an official website, nor is it affiliated with or linked to Holy Name University.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    Please confirm if you want to continue to the main website.
                </CardContent>
                <CardFooter className="flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/home">Yes, proceed</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href="https://www.hnu.edu.ph" target="_blank" rel="noreferrer">
                            No, exit
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
