"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    Code2,
    Menu,
    X,
    LayoutDashboard,
    ShieldCheck,
    BellRing,
    Workflow,
    ArrowRight,
} from "lucide-react";

export default function LearnMorePage() {
    const [menuOpen, setMenuOpen] = useState(false);

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

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
            {/* Header */}
            <header className="w-full sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-green-100">
                <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-3">
                    {/* Logo + Title */}
                    <div className="flex items-center gap-1">
                        <Link
                            href="/"
                            className="flex items-center gap-1 hover:opacity-90 transition-opacity"
                        >
                            <Image
                                src="/clinic-illustration.svg"
                                alt="HNU Clinic logo"
                                width={48}
                                height={48}
                                priority
                                className="md:w-14 md:h-14"
                            />
                            <h1 className="text-lg md:text-2xl font-bold text-green-600 leading-none">
                                HNU Clinic
                            </h1>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        {navigation.map((item) => (
                            <Link key={item.label} href={item.href} className="text-gray-700 hover:text-green-600 transition">
                                {item.label}
                            </Link>
                        ))}
                        <Link href="/login">
                            <Button className="bg-green-600 hover:bg-green-700 shadow-sm">Login</Button>
                        </Link>
                    </nav>

                    {/* Mobile Nav Toggle */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                    >
                        {menuOpen ? (
                            <X className="w-6 h-6 text-green-600" />
                        ) : (
                            <Menu className="w-6 h-6 text-green-600" />
                        )}
                    </button>
                </div>

                {/* Mobile Dropdown */}
                {menuOpen && (
                    <div className="flex flex-col gap-3 px-4 pb-5 md:hidden bg-white/95">
                        {navigation.map((item) => (
                            <Link key={item.label} href={item.href} className="text-gray-700 hover:text-green-600">
                                {item.label}
                            </Link>
                        ))}
                        <Link href="/login">
                            <Button className="w-full bg-green-600 hover:bg-green-700">Login</Button>
                        </Link>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-100 via-white to-green-50" />
                <div className="absolute inset-y-0 right-0 -z-10 h-full w-1/2 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_65%)]" />
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-16 md:py-24 gap-12">
                    <div className="max-w-xl space-y-6 text-center md:text-left">
                        <span className="inline-flex items-center rounded-full border border-green-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-green-700">
                            Platform Overview
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-green-700 leading-tight">
                            HNU Clinic’s digital system keeps campus healthcare organized, secure, and accessible.
                        </h2>
                        <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                            From streamlined appointment requests to comprehensive visit documentation, the platform supports every stage of the patient journey for students, faculty, and staff.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <Link href="/login">
                                <Button size="lg" className="bg-green-600 hover:bg-green-700 shadow-md">
                                    Go to Portal
                                </Button>
                            </Link>
                            <Link href="/about" className="flex items-center justify-center gap-2 text-green-700 text-sm font-medium hover:text-green-800">
                                <span>Discover our clinic team</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                    <div className="flex justify-center md:justify-end flex-1">
                        <Image
                            src="/header-illustration.svg"
                            alt="Clinic platform dashboard"
                            width={800}
                            height={600}
                            priority
                            className="w-full max-w-md md:max-w-lg lg:max-w-xl h-auto drop-shadow-xl"
                        />
                    </div>
                </div>
            </section>

            {/* Platform Highlights */}
            <section className="px-6 md:px-12 py-16 md:py-20">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <h3 className="text-2xl md:text-3xl font-bold text-green-600">What the system delivers</h3>
                        <p className="text-gray-600">
                            Purpose-built modules ensure everyone at HNU Clinic works from the same, up-to-date information while maintaining confidentiality.
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        {highlights.map(({ title, description, icon: Icon }) => (
                            <Card key={title} className="rounded-2xl border-green-100 bg-white/90 shadow-lg hover:shadow-xl transition">
                                <CardHeader className="flex flex-col gap-4">
                                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-sm">
                                        <Icon className="h-6 w-6" />
                                    </span>
                                    <CardTitle className="text-xl font-semibold text-green-700">{title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-sm text-gray-600 leading-relaxed">
                                    {description}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Technologies Used */}
            <section className="py-16 md:py-20 px-6 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto space-y-10">
                    <div className="text-center space-y-4">
                        <Code2 className="w-12 h-12 text-green-600 mx-auto" />
                        <h3 className="text-2xl md:text-3xl font-bold text-green-600">Modern tools that power the experience</h3>
                        <p className="text-gray-600 max-w-3xl mx-auto">
                            Our technology stack combines reliable frameworks and UI libraries to keep the platform scalable and intuitive.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { name: "Next.js", logo: "/logos/nextjs.svg" },
                            { name: "TypeScript", logo: "/logos/typescript.svg" },
                            { name: "Tailwind CSS", logo: "/logos/tailwind.svg" },
                            { name: "ShadCN/UI", logo: "/logos/shadcn.svg" },
                            { name: "Lucide Icons", logo: "/logos/lucide.svg" },
                            { name: "NextAuth", logo: "/logos/nextauth.svg" },
                            { name: "Zod", logo: "/logos/zod.svg" },
                            { name: "Vercel", logo: "/logos/vercel.svg" },
                        ].map((tech) => (
                            <Card key={tech.name} className="rounded-2xl border-green-100 bg-white shadow-sm">
                                <CardContent className="flex flex-col items-center gap-4 p-6">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                                        <Image src={tech.logo} alt={tech.name} width={48} height={48} className="object-contain" />
                                    </div>
                                    <p className="text-sm font-medium text-green-700">{tech.name}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section className="py-16 md:py-20 px-6 md:px-12">
                <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-center">
                    <div className="space-y-6">
                        <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-green-700">
                            <Workflow className="h-4 w-4" /> Workflow Snapshot
                        </span>
                        <h3 className="text-2xl md:text-3xl font-bold text-green-600">How an appointment moves through the system</h3>
                        <p className="text-gray-600 leading-relaxed">
                            A guided process keeps everyone aligned—from the moment a request is submitted to the final follow-up instructions documented by clinic staff.
                        </p>
                        <div className="space-y-4">
                            {process.map((step, index) => (
                                <Card key={step.title} className="rounded-2xl border-green-100 bg-white/90 shadow-sm">
                                    <CardContent className="flex gap-4 p-6">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white font-semibold">
                                            {index + 1}
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">{step.title}</p>
                                            <p className="text-sm text-gray-600 leading-relaxed">{step.detail}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                    <Card className="rounded-3xl border-none bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white shadow-xl">
                        <CardContent className="p-8 space-y-5">
                            <h4 className="text-2xl font-semibold">Designed for confident clinic operations</h4>
                            <p className="text-sm md:text-base text-white/80 leading-relaxed">
                                The portal brings scheduling, communication, and documentation together in one workflow so staff can focus on care while technology handles the details.
                            </p>
                            <ul className="space-y-3 text-sm md:text-base text-white/80">
                                <li>• Accessible on campus or remotely</li>
                                <li>• Built with secure authentication and validation</li>
                                <li>• Structured data for accurate reporting</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Developers Section */}
            <section className="py-16 md:py-20 px-6 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <Users className="w-12 h-12 text-green-600 mx-auto" />
                        <h3 className="text-2xl md:text-3xl font-bold text-green-600">Meet the developers</h3>
                        <p className="text-gray-600 max-w-3xl mx-auto">
                            A collaborative team of HNU students engineered the platform, uniting backend reliability with intuitive user experiences.
                        </p>
                    </div>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                name: "David Matthew Maniwang",
                                role: "Project Lead / Backend Developer",
                                img: "/profile/pic1.png",
                            },
                            {
                                name: "Dulce Maris Ongyot",
                                role: "Database & Integration",
                                img: "/profile/pic2.png",
                            },
                            {
                                name: "Joanamarie Ayuban Burato",
                                role: "Frontend Developer / UI Designer",
                                img: "/profile/pic3.jpg",
                            },
                            {
                                name: "Christian Dale Ombrosa",
                                role: "Frontend Developer / UX Designer",
                                img: "/profile/pic4.png",
                            },
                        ].map((dev) => (
                            <Card key={dev.name} className="rounded-2xl border-green-100 bg-white/90 shadow-sm">
                                <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                                    <Image
                                        src={dev.img}
                                        alt={dev.name}
                                        width={130}
                                        height={130}
                                        className="h-32 w-32 rounded-full object-cover shadow"
                                    />
                                    <div className="space-y-1">
                                        <p className="text-base font-semibold text-green-700">{dev.name}</p>
                                        <p className="text-sm text-gray-600">{dev.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to action */}
            <section className="px-6 md:px-12 py-16">
                <div className="max-w-5xl mx-auto rounded-3xl border border-green-200 bg-gradient-to-br from-green-100 via-white to-green-50 p-10 text-center shadow-lg">
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600">Ready to streamline clinic operations?</h3>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                        Log in to the HNU Clinic portal to manage appointments, update records, and keep your team aligned with the latest patient information.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/login">
                            <Button size="lg" className="bg-green-600 hover:bg-green-700 shadow-md">
                                Access the portal
                            </Button>
                        </Link>
                        <Link href="/#contact" className="text-sm font-medium text-green-700 hover:text-green-800">
                            Contact the clinic support team
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-green-900 text-green-50">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid gap-8 md:grid-cols-3">
                    <div className="space-y-3">
                        <p className="text-lg font-semibold">HNU Clinic</p>
                        <p className="text-sm text-green-100 leading-relaxed">
                            Supporting Holy Name University with a modern, patient-centered clinic experience.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <p className="text-lg font-semibold">Quick Links</p>
                        <ul className="space-y-2 text-sm text-green-100">
                            {navigation.map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="hover:text-white transition">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <p className="text-lg font-semibold">Need assistance?</p>
                        <p className="text-sm text-green-100 leading-relaxed">
                            Visit the About page to meet the clinic team or send a message through the contact form for tailored support.
                        </p>
                        <Link href="/about" className="inline-flex text-sm text-white font-medium underline-offset-4 hover:underline">
                            Meet the health services department
                        </Link>
                    </div>
                </div>
                <div className="border-t border-green-700/60 text-center py-4 text-xs text-green-200">
                    © {new Date().getFullYear()} HNU Clinic Capstone Project
                </div>
            </footer>
        </div>
    );
}
