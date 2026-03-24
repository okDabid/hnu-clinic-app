import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SiteHeader } from "@/components/marketing/site-header";
import { LogoLoop } from "@/components/ui/LogoLoop";
import {
    Users,
    LayoutDashboard,
    ShieldCheck,
    BellRing,
    Workflow,
    ArrowRight,
    Code2,
} from "lucide-react";

const navigation = [
    { href: "/#features", label: "Features" },
    { href: "/#workflow", label: "Workflow" },
    { href: "/about", label: "About" },
    { href: "/learn-more", label: "Learn More" },
    { href: "/privacy", label: "Privacy" },
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
    { name: "Next.js", logo: "/logos/nextjs.svg", href: "https://nextjs.org" },
    { name: "TypeScript", logo: "/logos/typescript.svg", href: "https://www.typescriptlang.org" },
    { name: "Tailwind CSS", logo: "/logos/tailwind.svg", href: "https://tailwindcss.com" },
    { name: "ShadCN/UI", logo: "/logos/shadcn.svg", href: "https://ui.shadcn.com" },
    { name: "Lucide Icons", logo: "/logos/lucide.svg", href: "https://lucide.dev" },
    { name: "NextAuth", logo: "/logos/nextauth.svg", href: "https://next-auth.js.org" },
    { name: "Zod", logo: "/logos/zod.svg", href: "https://zod.dev" },
    { name: "Vercel", logo: "/logos/vercel.svg", href: "https://vercel.com" },
];

const developers = [
    {
        name: "David Matthew Maniwang",
        role: "Project Lead",
        img: "/profile/pic1.png",
    },
    {
        name: "Dulce Maris Ongyot",
        role: "Member",
        img: "/profile/pic2.png",
    },
    {
        name: "Joanamarie Ayuban Burato",
        role: "Member",
        img: "/profile/pic3.jpg",
    },
    {
        name: "Christian Dale Ombrosa",
        role: "Member",
        img: "/profile/pic4.png",
    },
];

export default function LearnMorePage() {
    return (
        <div className="flex min-h-screen flex-col bg-linear-to-b from-primary/10 via-white to-primary/5">
            <SiteHeader navigation={navigation} />

            <main className="flex-1">
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-white to-primary/5" />
                    <div className="absolute inset-y-0 right-0 -z-10 h-full w-full md:w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(22,163,74,0.15),transparent_60%)]" />
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 py-16 md:flex-row md:px-12 md:py-24">
                        <div className="max-w-xl space-y-6 text-center md:text-left">
                            <span className="inline-flex items-center rounded-full border border-primary/20 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                                Platform Overview
                            </span>
                            <h2 className="text-3xl font-bold leading-tight text-primary md:text-5xl">
                                HNU Clinic’s digital system keeps campus healthcare organized, secure, and accessible
                            </h2>
                            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                                From streamlined appointment requests to comprehensive visit documentation, the platform supports every stage of the patient journey for students, faculty, and staff.
                            </p>
                            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
                                <Link href="/login">
                                    <Button size="lg" className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
                                        Go to Portal
                                    </Button>
                                </Link>
                                <Link
                                    href="/about"
                                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
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
                            <h3 className="text-2xl font-bold text-primary md:text-3xl">What the system delivers</h3>
                            <p className="text-muted-foreground">
                                Purpose-built modules ensure everyone at HNU Clinic works from the same, up-to-date information while maintaining confidentiality.
                            </p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                            {highlights.map(({ title, description, icon: Icon }) => (
                                <Card key={title} className="rounded-2xl border-primary/20 bg-white/90 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                                    <CardHeader className="flex flex-col gap-4">
                                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                                            <Icon className="h-6 w-6" />
                                        </span>
                                        <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0 text-sm leading-relaxed text-muted-foreground">{description}</CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
                <section className="bg-white px-6 py-16 md:px-12 md:py-20">
                    <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.1fr_0.9fr] items-center">
                        <div className="space-y-6">
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                                <Workflow className="h-4 w-4" /> Workflow Snapshot
                            </span>
                            <h3 className="text-2xl font-bold text-primary md:text-3xl">How an appointment moves through the system</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                A guided process keeps everyone aligned—from the moment a request is submitted to the final follow-up instructions documented by clinic staff.
                            </p>
                            <div className="space-y-4">
                                {process.map((step, index) => (
                                    <Card key={step.title} className="rounded-2xl border-primary/20 bg-white/90 shadow-sm">
                                        <CardContent className="flex gap-4 p-6">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                                                {index + 1}
                                            </span>
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-primary uppercase tracking-wide">{step.title}</p>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                        <Card className="rounded-3xl border-none bg-linear-to-br bg-emerald-600 text-primary-foreground shadow-xl">
                            <CardContent className="space-y-5 p-8">
                                <h4 className="text-2xl font-semibold">Designed for confident clinic operations</h4>
                                <p className="text-sm text-primary-foreground/90 md:text-base leading-relaxed">
                                    The portal brings scheduling, communication, and documentation together in one workflow so staff can focus on care while technology handles the details.
                                </p>
                                <ul className="space-y-3 text-sm text-primary-foreground/90 md:text-base">
                                    <li>• Accessible on campus or remotely</li>
                                    <li>• Built with secure authentication and validation</li>
                                    <li>• Structured data for accurate reporting</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>
                <section className="bg-white px-6 py-16 md:px-12 md:py-10">
                    <div className="mx-auto max-w-6xl space-y-12">
                        <div className="space-y-4 text-center">
                            <Code2 className="mx-auto h-12 w-12 text-primary" />
                            <h3 className="text-2xl font-bold text-primary md:text-3xl">Modern tools that power the experience</h3>
                            <p className="mx-auto max-w-3xl text-muted-foreground">
                                Our technology stack combines reliable frameworks and UI libraries to keep the platform scalable and intuitive.
                            </p>
                        </div>

                        <div className="space-y-10">
                            <div className="overflow-hidden">
                                <LogoLoop
                                    logos={techStack.map((tech) => ({
                                        src: tech.logo,
                                        alt: tech.name,
                                        title: tech.name,
                                        href: tech.href,
                                        width: 84,
                                        height: 48,
                                    }))}
                                    ariaLabel="Clinic technology stack logos"
                                    speed={85}
                                    direction="left"
                                    logoHeight={50}
                                    gap={48}
                                    pauseOnHover
                                    fadeOut
                                    fadeOutColor="rgba(248, 250, 252, 0.95)"
                                    scaleOnHover
                                    className="px-4 py-6"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white px-6 py-16 md:px-12 md:py-20">
                    <div className="mx-auto max-w-6xl space-y-12">
                        <div className="space-y-4 text-center">
                            <Users className="mx-auto h-12 w-12 text-primary" />
                            <h3 className="text-2xl font-bold text-primary md:text-3xl">Meet the developers</h3>
                            <p className="mx-auto max-w-3xl text-muted-foreground">
                                A collaborative team of HNU students engineered the platform, uniting backend reliability with intuitive user experiences.
                            </p>
                        </div>
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {developers.map((dev) => (
                                <Card key={dev.name} className="rounded-2xl border-primary/20 bg-white/90 shadow-sm">
                                    <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                                        <Image
                                            src={dev.img}
                                            alt={dev.name}
                                            width={130}
                                            height={130}
                                            className="h-32 w-32 rounded-full object-cover shadow"
                                        />
                                        <div className="space-y-1">
                                            <p className="text-base font-semibold text-primary">{dev.name}</p>
                                            <p className="text-sm text-muted-foreground">{dev.role}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-6 py-16 md:px-12">
                    <div className="mx-auto max-w-5xl rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-white to-primary/5 p-10 text-center shadow-lg">
                        <h3 className="text-2xl font-bold text-primary md:text-3xl">Ready to streamline clinic operations?</h3>
                        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                            Log in to the HNU Clinic portal to manage appointments, update records, and keep your patient data secured.
                        </p>
                        <div className="mt-8 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
                            <Link href="/login" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
                                    Access the portal
                                </Button>
                            </Link>
                            <Link href="/#contact" className="text-sm font-medium text-primary hover:text-primary/80">
                                Contact the clinic support team
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-primary text-primary-foreground">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:px-12 md:grid-cols-3">
                    <div className="space-y-3">
                        <p className="text-lg font-semibold">HNU Clinic</p>
                        <p className="text-sm leading-relaxed text-primary-foreground/80">
                            Supporting Holy Name University with a modern, patient-centered clinic experience.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <p className="text-lg font-semibold">Quick Links</p>
                        <ul className="space-y-2 text-sm text-primary-foreground/80">
                            {navigation.map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="transition hover:text-primary-foreground">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <p className="text-lg font-semibold">Need assistance?</p>
                        <p className="text-sm leading-relaxed text-primary-foreground/80">
                            Visit the About page to meet the clinic team or send a message through the contact form for tailored support.
                        </p>
                        <Link href="/about" className="inline-flex text-sm font-medium text-primary-foreground underline-offset-4 hover:underline">
                            Meet the health services department
                        </Link>
                    </div>
                </div>
                <div className="border-t border-primary-foreground/20 py-4 text-center text-xs text-primary-foreground/80">
                    © {new Date().getFullYear()} HNU Clinic Health Record &amp; Appointment System
                </div>
            </footer>
        </div>
    );
}
