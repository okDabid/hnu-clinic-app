"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Users, Code2, Menu, X } from "lucide-react";

export default function LearnMorePage() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-green-50">
            {/* Header */}
            <header className="w-full sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b">
                <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-2.5">
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
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link href="/#features" className="text-gray-700 hover:text-green-600 transition">
                            Features
                        </Link>
                        <Link href="/about" className="text-gray-700 hover:text-green-600 transition">
                            About
                        </Link>
                        <Link href="/#contact" className="text-gray-700 hover:text-green-600 transition">
                            Contact
                        </Link>
                        <Link href="/login">
                            <Button className="bg-green-600 hover:bg-green-700">Login</Button>
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
                    <div className="flex flex-col gap-3 px-4 pb-4 md:hidden">
                        <Link href="/#features" className="text-gray-700 hover:text-green-600">
                            Features
                        </Link>
                        <Link href="/about" className="text-gray-700 hover:text-green-600">
                            About
                        </Link>
                        <Link href="/#contact" className="text-gray-700 hover:text-green-600">
                            Contact
                        </Link>
                        <Link href="/login">
                            <Button className="w-full bg-green-600 hover:bg-green-700">Login</Button>
                        </Link>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20 gap-10">
                <div className="max-w-xl text-center md:text-left space-y-6">
                    <h2 className="text-3xl md:text-5xl font-bold text-green-600 leading-tight">
                        Learn More About HNU Clinic
                    </h2>
                    <p className="text-gray-700 text-base md:text-lg">
                        The HNU Clinic Health Record & Appointment System is designed to
                        simplify patient care by combining record management, appointment
                        scheduling, and doctor–patient communication in one secure,
                        user-friendly platform.
                    </p>
                </div>
                <div className="flex justify-center md:justify-end flex-1">
                    <Image
                        src="/header-illustration.svg"
                        alt="learn more illustration"
                        width={800}
                        height={600}
                        priority
                        className="w-full max-w-md md:max-w-lg lg:max-w-2xl h-auto"
                    />
                </div>
            </section>

            {/* Technologies Used */}
            <section className="py-16 md:py-20 px-6 md:px-12 border-t border-green-100">
                <div className="max-w-6xl mx-auto text-center space-y-10">
                    <Code2 className="w-12 h-12 text-green-600 mx-auto" />
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600">
                        Technologies Used
                    </h3>
                    <p className="text-gray-700 text-base md:text-lg max-w-3xl mx-auto">
                        The system was built using modern web technologies to ensure
                        reliability, scalability, and smooth user experience.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-8 gap-10 items-center justify-center">
                        {[
                            { name: "Next.js", logo: "/logos/nextjs.svg" },
                            { name: "Vercel", logo: "/logos/vercel.svg" },
                            { name: "TypeScript", logo: "/logos/typescript.svg" },
                            { name: "Tailwind CSS", logo: "/logos/tailwind.svg" },
                            { name: "ShadCN/UI", logo: "/logos/shadcn.svg" },
                            { name: "Lucide Icons", logo: "/logos/lucide.svg" },
                            { name: "NextAuth", logo: "/logos/nextauth.svg" },
                            { name: "Zod", logo: "/logos/zod.svg" },
                        ].map((tech) => (
                            <div
                                key={tech.name}
                                className="flex flex-col items-center space-y-3 text-center"
                            >
                                <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-sm p-2">
                                    <Image
                                        src={tech.logo}
                                        alt={tech.name}
                                        width={40}
                                        height={40}
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-green-700 font-medium text-sm md:text-base">
                                    {tech.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Developers Section */}
            <section className="py-16 md:py-20 px-6 md:px-12 border-t border-green-100">
                <div className="max-w-6xl mx-auto text-center space-y-10">
                    <Users className="w-12 h-12 text-green-600 mx-auto" />
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600">
                        Meet the Developers
                    </h3>
                    <p className="text-gray-700 text-base md:text-lg max-w-3xl mx-auto mb-12">
                        The system was created by passionate HNU students — blending
                        teamwork, creativity, and innovation to improve healthcare
                        accessibility.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 place-items-center">
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
                            <div
                                key={dev.name}
                                className="flex flex-col items-center text-center space-y-2"
                            >
                                <Image
                                    src={dev.img}
                                    alt={dev.name}
                                    width={130}
                                    height={130}
                                    className="rounded-full shadow-md object-cover"
                                />
                                <h4 className="font-semibold text-lg text-green-600">
                                    {dev.name}
                                </h4>
                                <p className="text-sm text-gray-600">{dev.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-6 text-center text-gray-600 text-sm md:text-base border-t">
                © {new Date().getFullYear()} HNU Clinic Capstone Project
            </footer>
        </div>
    );
}
