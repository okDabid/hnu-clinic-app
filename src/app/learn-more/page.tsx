import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SiteHeader } from "@/components/marketing/site-header";
import {
    Users,
    Code2,
    LayoutDashboard,
    ShieldCheck,
    BellRing,
    Workflow,
    ArrowRight,
} from "lucide-react";

const navigation = [
    { href: "/#features", label: "Features" },
    { href: "/about", label: "About" },
    { href: "/learn-more", label: "Learn More" },
    { href: "/#contact", label: "Contact" },
];

const highlights = [
    {
        title: "Unified Patient Profiles",
        description: "All appointments, notes, and health records are consolidated into one secure dashboard for doctors and nurses.",
        icon: LayoutDashboard,
    },
    {
        title: "Secure Access Controls",
        description: "Role-based permissions and audit-friendly tracking keep sensitive information protected.",
        icon: ShieldCheck,
    },
    {
        title: "Timely Communication",
        description: "Automated reminders and updates help patients stay prepared for every clinic visit.",
        icon: BellRing,
    },
];

const process = [
    {
        title: "Request",
        detail: "Patients submit appointment requests through the portal with essential visit details.",
    },
    {
        title: "Coordinate",
        detail: "Clinic staff review, schedule, and confirm availability with integrated calendars.",
    },
    {
        title: "Care & Follow-up",
        detail: "Providers document outcomes and share next steps directly in the patient's record.",
    },
];

const techStack = [
    "Next.js App Router",
    "TypeScript",
    "Prisma & PostgreSQL",
    "Tailwind CSS",
    "Lucide Icons",
    "NextAuth",
];

export default function LearnMorePage() {
    return (
        <div className="flex min-h-screen flex-col bg-linear-to-b from-green-50 via-white to-green-50">
            <SiteHeader navigation={navigation} />

            <main className="flex-1">
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-linear-to-br from-green-100 via-white to-green-50" />
                    <div className="absolute inset-y-0 right-0 -z-10 h-full w-1/2 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_65%)]" />
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 py-16 md:flex-row md:px-12 md:py-24">
                        <div className="max-w-xl space-y-6 text-center md:text-left">
                            <span className="inline-flex items-center rounded-full border border-green-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-green-700">
                                Platform Overview
                            </span>
                            <h2 className="text-3xl font-bold leading-tight text-green-700 md:text-5xl">
                                HNU Clinic’s digital system keeps campus healthcare organized, secure, and accessible.
                            </h2>
                            <p className="text-base leading-relaxed text-gray-700 md:text-lg">
                                From streamlined appointment requests to comprehensive visit documentation, the platform supports every stage of the patient journey for students, faculty, and staff.
                            </p>
                            <div className="flex flex-col items-center gap-4 sm:flex-row md:items-start">
                                <Link href="/login">
                                    <Button size="lg" className="w-full bg-green-600 text-white shadow-md hover:bg-green-700 sm:w-auto">
                                        Go to Portal
                                    </Button>
                                </Link>
                                <Link
                                    href="/about"
                                    className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
                                >
                                    <span>Discover our clinic team</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                        <div className="flex flex-1 justify-center md:justify-end">
                            <Image
                                src="/header-illustration.svg"
                                alt="Clinic platform dashboard"
                                width={800}
                                height={600}
                                priority
                                className="h-auto w-full max-w-md drop-shadow-xl md:max-w-lg lg:max-w-xl"
                            />
                        </div>
                    </div>
                </section>

                <section className="px-6 py-16 md:px-12 md:py-20">
                    <div className="mx-auto max-w-6xl space-y-12">
                        <div className="mx-auto max-w-3xl space-y-4 text-center">
                            <h3 className="text-2xl font-bold text-green-600 md:text-3xl">What the system delivers</h3>
                            <p className="text-gray-600">
                                Purpose-built modules ensure everyone at HNU Clinic works from the same, up-to-date information while maintaining confidentiality.
                            </p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                            {highlights.map(({ title, description, icon: Icon }) => (
                                <Card key={title} className="rounded-2xl border-green-100 bg-white/90 shadow-lg transition hover:shadow-xl">
                                    <CardHeader className="flex flex-col gap-4">
                                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-sm">
                                            <Icon className="h-6 w-6" />
                                        </span>
                                        <CardTitle className="text-xl font-semibold text-green-700">{title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0 text-sm leading-relaxed text-gray-600">{description}</CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white px-6 py-16 md:px-12 md:py-20">
                    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[2fr,1fr]">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-green-600 md:text-3xl">How the clinic team collaborates</h3>
                            <p className="text-gray-600">
                                Coordinated care means everyone has the context they need. The HNU Clinic platform connects providers, staff, and patients with purposeful tools.
                            </p>
                            <div className="space-y-4">
                                {process.map((step, index) => (
                                    <Card key={step.title} className="rounded-2xl border-green-100 bg-white/95 shadow-lg">
                                        <CardHeader className="flex items-center gap-4">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg font-semibold text-green-700">
                                                {index + 1}
                                            </span>
                                            <CardTitle className="text-lg text-green-700">{step.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0 text-sm leading-relaxed text-gray-600">{step.detail}</CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <Card className="rounded-2xl border-green-100 bg-green-50/80 shadow-inner">
                                <CardHeader className="space-y-4 text-center">
                                    <Users className="mx-auto h-10 w-10 text-green-600" />
                                    <CardTitle className="text-lg font-semibold text-green-700">Teams supported</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-3 text-sm text-gray-600">
                                    <span className="rounded-lg bg-white/80 px-4 py-2 shadow-sm">Doctors and specialists</span>
                                    <span className="rounded-lg bg-white/80 px-4 py-2 shadow-sm">Nurses and clinic staff</span>
                                    <span className="rounded-lg bg-white/80 px-4 py-2 shadow-sm">Students, faculty, and employees</span>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl border-green-100 bg-white/95 shadow-lg">
                                <CardHeader className="space-y-4 text-center">
                                    <Workflow className="mx-auto h-10 w-10 text-green-600" />
                                    <CardTitle className="text-lg font-semibold text-green-700">Technology foundation</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2 text-sm text-gray-600">
                                    {techStack.map((item) => (
                                        <span key={item} className="rounded-lg border border-green-100 bg-white/90 px-3 py-2">
                                            {item}
                                        </span>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                <section className="bg-linear-to-r from-green-50 to-white px-6 py-16 md:px-12 md:py-20">
                    <div className="mx-auto max-w-6xl space-y-6 text-center">
                        <Code2 className="mx-auto h-12 w-12 text-green-600" />
                        <h3 className="text-2xl font-bold text-green-600 md:text-3xl">Built with reliability in mind</h3>
                        <p className="mx-auto max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
                            Resilient infrastructure keeps records available and requests moving quickly. Automated health checks, database pooling, and background maintenance work together so the clinic team can stay focused on delivering care.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
