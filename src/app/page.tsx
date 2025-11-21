import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ContactForm } from "@/components/marketing/contact-form";
import { SiteHeader } from "@/components/marketing/site-header";
import {
    CalendarDays,
    ClipboardList,
    Stethoscope,
    ShieldCheck,
    Clock,
    MapPin,
} from "lucide-react";

const navigation = [
    { href: "#features", label: "Features" },
    { href: "#workflow", label: "Workflow" },
    { href: "/about", label: "About" },
    { href: "/learn-more", label: "Learn More" },
    { href: "/privacy", label: "Privacy" },
    { href: "#contact", label: "Contact" },
];

const featureCards = [
    {
        title: "Easy Appointment Booking",
        description: "Schedule consultations on any device with reminders that keep everyone on time.",
        icon: CalendarDays,
    },
    {
        title: "Centralized Health Records",
        description: "All patient information stays synchronized so the care team always has the latest details.",
        icon: ClipboardList,
    },
    {
        title: "Collaborative Care",
        description: "Doctors, nurses, and staff work together seamlessly with shared dashboards and updates.",
        icon: Stethoscope,
    },
];

const workflowSteps = [
    {
        title: "Request",
        description: "Patients submit appointment requests in minutes—no phone calls required.",
    },
    {
        title: "Coordinate",
        description: "Clinic staff manage availability and confirmations from one streamlined view.",
    },
    {
        title: "Care",
        description: "Providers record consultation outcomes and next steps for an organized follow-up.",
    },
];

export default function HomePage() {
    return (
        <div className="flex min-h-screen flex-col bg-linear-to-b from-primary/10 via-white to-primary/5">
            <SiteHeader navigation={navigation} />

            <main className="flex-1">
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-white to-primary/5" />
                    <div className="absolute inset-y-0 right-0 -z-10 h-full w-full md:w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(22,163,74,0.15),transparent_60%)]" />
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 py-16 md:flex-row md:px-12 md:py-24">
                        <div className="max-w-xl space-y-6 text-center md:text-left">
                            <span className="inline-flex items-center rounded-full border border-primary/20 bg-white px-4 py-1 text-sm font-semibold text-primary shadow-sm">
                                HNU Clinic · Capstone Project
                            </span>
                            <h2 className="text-3xl font-bold leading-tight text-primary md:text-5xl">
                                Manage health records, book visits, and stay connected.
                            </h2>
                            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                                Our public homepage at <Link href="https://www.hnu-clinic-app.com/" className="font-semibold text-primary underline underline-offset-2">www.hnu-clinic-app.com</Link> introduces the system students, faculty, and staff use to request appointments, manage records, and coordinate care.
                            </p>
                            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                                We help patients schedule visits, notify patients of updates, and keep sensitive information synchronized. All while upholding the privacy expectations of the HNU community.
                            </p>
                        </div>
                        <div className="flex flex-1 justify-center md:justify-end">
                            <Image
                                src="/header-illustration.svg"
                                alt="Care team collaborating"
                                width={800}
                                height={600}
                                priority
                                className="h-auto w-full max-w-md drop-shadow-xl md:max-w-lg lg:max-w-xl"
                            />
                        </div>
                    </div>
                </section>

                <section id="features" className="bg-white px-6 py-16 md:px-12 md:py-15">
                    <div className="mx-auto max-w-7xl space-y-12">
                        <div className="mx-auto max-w-3xl space-y-4 text-center">
                            <h3 className="text-2xl font-bold text-primary md:text-3xl">Built for dependable clinic operations</h3>
                            <p className="text-muted-foreground">
                                HNU Clinic brings essential services together so patients and providers can focus on care—not coordination.
                            </p>
                        </div>
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {featureCards.map(({ title, description, icon: Icon }) => (
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

                <section id="workflow" className="bg-linear-to-r from-primary/10 via-white to-primary/5 px-6 py-16 md:px-12 md:py-20">
                    <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row">
                        <div className="flex-1 space-y-5">
                            <h3 className="text-2xl font-bold text-primary md:text-3xl">A connected workflow from booking to follow-up</h3>
                            <p className="text-muted-foreground">
                                Every interaction—scheduling, attendance, documentation—feeds into one secure system so nothing slips through the cracks.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white/90 p-4 shadow-sm">
                                    <ShieldCheck className="h-10 w-10 text-primary" />
                                    <div>
                                        <p className="font-semibold text-primary">Secure access</p>
                                        <p className="text-sm text-muted-foreground">
                                            Role-based permissions ensure patient data is always protected.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white/90 p-4 shadow-sm">
                                    <Clock className="h-10 w-10 text-primary" />
                                    <div>
                                        <p className="font-semibold text-primary">Smarter scheduling</p>
                                        <p className="text-sm text-muted-foreground">
                                            Duty hours, leave management, and reminders keep appointments running smoothly.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white/90 p-4 shadow-sm">
                                    <MapPin className="h-10 w-10 text-primary" />
                                    <div>
                                        <p className="font-semibold text-primary">Clinic coverage</p>
                                        <p className="text-sm text-muted-foreground">
                                            Track which clinics are staffed each day with real-time availability.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-6">
                            <div className="space-y-4">
                                {workflowSteps.map((step, index) => (
                                    <Card key={step.title} className="rounded-2xl border-primary/20 bg-white/95 shadow-lg">
                                        <CardHeader className="flex items-center gap-4">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                                                {index + 1}
                                            </span>
                                            <CardTitle className="text-lg text-primary">{step.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0 text-sm leading-relaxed text-muted-foreground">{step.description}</CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="contact" className="bg-white px-6 pb-16 md:px-12 md:pb-20">
                    <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-primary md:text-3xl">Let’s connect</h3>
                            <p className="text-muted-foreground">
                                Reach out to learn more about the HNU Clinic platform or request a walkthrough for your team.
                            </p>
                            <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/10 p-6 text-sm text-primary">
                                <p className="font-semibold text-primary">Verified presence</p>
                                <p>
                                    This application is presented by HNU Clinic and currently hosted on <Link href="https://www.hnu-clinic-app.com/" className="font-semibold underline underline-offset-2">www.hnu-clinic-app.com</Link>, where you can review privacy details before signing in.
                                </p>
                                <p>
                                    Our team typically responds within one business day.
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-primary/20 bg-white/90 p-6 shadow-lg">
                            <ContactForm />
                        </div>
                    </div>
                </section>
            </main>
            <footer className="bg-primary text-primary-foreground">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:px-12 md:grid-cols-3">
                    <div className="space-y-3">
                        <p className="text-lg font-semibold">HNU Clinic</p>
                        <p className="text-sm leading-relaxed text-primary-foreground/80">
                            Dedicated to providing a safe and welcoming health experience for the Holy Name University community.
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
                        <p className="text-lg font-semibold">Connect with Us</p>
                        <p className="text-sm leading-relaxed text-primary-foreground/80">
                            Reach out to the clinic staff for guidance on scheduling, records, or wellness programs tailored to campus needs.
                        </p>
                        <Link
                            href="/learn-more"
                            className="inline-flex text-sm font-medium text-primary-foreground underline-offset-4 hover:underline"
                        >
                            Learn more about the system
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
