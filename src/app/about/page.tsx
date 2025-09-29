"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X } from "lucide-react";

export default function AboutPage() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-green-50 flex flex-col">
            {/* Header / Navbar */}
            <header className="w-full bg-white shadow px-4 md:px-8 py-4 sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    {/* Logo + Title */}
                    <div className="flex items-center gap-3">
                        <a href="/">
                            <Image
                                src="/clinic-illustration.svg"
                                alt="logo"
                                width={48}
                                height={48}
                                priority
                                className="md:w-16 md:h-16"
                            />
                        </a>
                        <h1 className="text-lg md:text-2xl font-bold text-green-600">
                            HNU Clinic
                        </h1>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/#features" className="text-gray-700 hover:text-green-600">
                            Features
                        </Link>
                        <Link href="/about" className="text-green-600 font-semibold">
                            About
                        </Link>
                        <Link href="/#contact" className="text-gray-700 hover:text-green-600">
                            Contact
                        </Link>
                        <Link href="/login">
                            <Button className="bg-green-600 hover:bg-green-700">Login</Button>
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? (
                            <X className="w-6 h-6 text-green-600" />
                        ) : (
                            <Menu className="w-6 h-6 text-green-600" />
                        )}
                    </button>
                </div>

                {/* Mobile Dropdown Nav */}
                {menuOpen && (
                    <div className="flex flex-col gap-4 mt-4 md:hidden">
                        <Link href="/" className="text-gray-700 hover:text-green-600">
                            Home
                        </Link>
                        <Link href="/#features" className="text-gray-700 hover:text-green-600">
                            Features
                        </Link>
                        <Link href="/about" className="text-green-600 font-semibold">
                            About
                        </Link>
                        <Link href="/#contact" className="text-gray-700 hover:text-green-600">
                            Contact
                        </Link>
                        <Link href="/login">
                            <Button className="bg-green-600 hover:bg-green-700 w-full">
                                Login
                            </Button>
                        </Link>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="px-6 md:px-12 py-16 md:py-24 bg-white shadow-sm">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-green-600 mb-6">
                        About HNU Clinic
                    </h1>
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                        HNU Clinic is committed to providing high-quality healthcare
                        services for students, employees, and the wider community
                        of Holy Name University. Our mission is to make healthcare
                        accessible, efficient, and patient-centered through modern
                        technology and compassionate care.
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="px-6 md:px-12 py-16 flex-1">
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-semibold text-green-600 mb-4">
                                Our Mission
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                To provide timely and reliable healthcare services through
                                innovation, collaboration, and commitment to the well-being of
                                our patients. We aim to empower students, employees, and the
                                community to take charge of their health.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-semibold text-green-600 mb-4">
                                Our Vision
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                To be a trusted healthcare partner, fostering a healthier HNU
                                community with accessible, integrated, and innovative healthcare
                                solutions.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Team Section */}
            <section className="px-6 md:px-12 py-16 bg-white">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-6">
                        Meet Our Team
                    </h2>
                    <p className="text-gray-700 mb-12">
                        Our dedicated team of doctors, nurses, working scholars, and staff
                        are here to provide compassionate care and reliable health services.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center">
                            <Image
                                src=""
                                alt="Doctor"
                                width={120}
                                height={120}
                                className="rounded-full mb-4"
                            />
                            <h3 className="font-semibold text-lg">Chopper</h3>
                            <p className="text-sm text-gray-600">Chief Physician</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <Image
                                src=""
                                alt="Nurse"
                                width={120}
                                height={120}
                                className="rounded-full mb-4"
                            />
                            <h3 className="font-semibold text-lg">Luffy</h3>
                            <p className="text-sm text-gray-600">Head Nurse</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <Image
                                src=""
                                alt="Scholar"
                                width={120}
                                height={120}
                                className="rounded-full mb-4"
                            />
                            <h3 className="font-semibold text-lg">Zoro</h3>
                            <p className="text-sm text-gray-600">Working Scholar</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-6 text-center text-gray-600">
                © {new Date().getFullYear()} HNU Clinic Capstone Project
            </footer>
        </div>
    );
}
