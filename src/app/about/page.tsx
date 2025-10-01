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
        <div className="flex flex-col min-h-screen bg-green-50">
            {/* Header */}
            <header className="w-full sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b">
                <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-4">
                    {/* Logo + Title */}
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Image
                                src="/clinic-illustration.svg"
                                alt="logo"
                                width={48}
                                height={48}
                                priority
                                className="md:w-16 md:h-16"
                            />
                        </Link>
                        <h1 className="text-lg md:text-2xl font-bold text-green-600">
                            HNU Clinic
                        </h1>
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
                    <div className="flex flex-col gap-3 px-4 pb-4 md:hidden">
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
                            <Button className="bg-green-600 hover:bg-green-700">
                                Login
                            </Button>
                        </Link>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="px-6 md:px-12 py-20 bg-gradient-to-br from-green-50 to-white text-center shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-bold text-green-600 mb-6">
                        About HNU Clinic
                    </h1>
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                        HNU Clinic is committed to providing high-quality healthcare
                        services for students, employees, and the wider community
                        of Holy Name University. Our mission is to make healthcare
                        accessible, efficient, and patient-centered through modern
                        technology and compassionate care.
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="px-6 md:px-12 py-20 bg-white">
                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
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

                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
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
            <section className="px-6 md:px-12 py-20 bg-green-50">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-6">
                        Meet Our Team
                    </h2>
                    <p className="text-gray-700 mb-12 max-w-2xl mx-auto">
                        Our dedicated team of doctors and nurses are here to
                        provide compassionate care and reliable health services.
                    </p>

                    <div className="space-y-16">
                        {/* Head */}
                        <div className="flex justify-center">
                            <div className="flex flex-col items-center">
                                <Image
                                    src="/head-illustration.png"
                                    alt="Head"
                                    width={140}
                                    height={140}
                                    className="rounded-full mb-4 shadow-md"
                                />
                                <h3 className="font-semibold text-lg text-green-600">
                                    Shanna Kathleen M. Escalona, MD
                                </h3>
                                <p className="text-sm text-gray-600">Head, Health Services Department</p>
                            </div>
                        </div>

                        {/* School Physician */}
                        <div className="flex justify-center">
                            <div className="flex flex-col items-center">
                                <Image
                                    src="/physician-illustration.png"
                                    alt="Physician"
                                    width={120}
                                    height={120}
                                    className="rounded-full mb-4 shadow-md"
                                />
                                <h3 className="font-semibold text-lg text-green-600">
                                    Lovella I. Calvelo, MD
                                </h3>
                                <p className="text-sm text-gray-600">School Physician</p>
                            </div>
                        </div>

                        {/* Dentists */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 justify-center max-w-3xl mx-auto">
                            {[
                                { name: "Minette B. Barrete", role: "School Dentist", img: "/dentist1-illustration.png" },
                                { name: "Roche T. Pamaran", role: "School Dentist", img: "/dentist2-illustration.png" },
                            ].map((member) => (
                                <div key={member.name} className="flex flex-col items-center">
                                    <Image
                                        src={member.img}
                                        alt={member.name}
                                        width={120}
                                        height={120}
                                        className="rounded-full mb-4 shadow-md"
                                    />
                                    <h3 className="font-semibold text-lg text-green-600">{member.name}</h3>
                                    <p className="text-sm text-gray-600">{member.role}</p>
                                </div>
                            ))}
                        </div>

                        {/* Nurses */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 justify-center max-w-5xl mx-auto">
                            {[
                                { name: "Cherly Marie B. Lagura, RN", role: "School Nurse", img: "/nurse1-illustration.png" },
                                { name: "Evangeline Y. Guieb, RN", role: "School Nurse", img: "/nurse2-illustration.png" },
                                { name: "Rhiza Rosario G. Magallones, RN", role: "School Nurse", img: "/nurse3-illustration.png" },
                            ].map((member) => (
                                <div key={member.name} className="flex flex-col items-center">
                                    <Image
                                        src={member.img}
                                        alt={member.name}
                                        width={120}
                                        height={120}
                                        className="rounded-full mb-4 shadow-md"
                                    />
                                    <h3 className="font-semibold text-lg text-green-600">{member.name}</h3>
                                    <p className="text-sm text-gray-600">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* Services Section */}
            <section className="px-6 md:px-12 py-20 bg-white">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-6">
                        Our Services
                    </h2>
                    <p className="text-gray-700 mb-12 max-w-2xl mx-auto">
                        Healthcare services at HNU Clinic are delivered through three core programs:
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-semibold text-green-600 mb-4">
                                    Health Assessment Program
                                </h3>
                                <ul className="list-disc list-inside text-gray-700 space-y-2">
                                    <li>Physical examinations</li>
                                    <li>Consultations</li>
                                    <li>Medical certificate issuance</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-semibold text-green-600 mb-4">
                                    Dental Program
                                </h3>
                                <ul className="list-disc list-inside text-gray-700 space-y-2">
                                    <li>Consultations and examinations</li>
                                    <li>Oral prophylaxis</li>
                                    <li>Tooth extractions</li>
                                    <li>Dental certificate issuance</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-semibold text-green-600 mb-4">
                                    Primary Care Program
                                </h3>
                                <ul className="list-disc list-inside text-gray-700 space-y-2">
                                    <li>Support for urgent medical needs</li>
                                    <li>Care for minor injuries</li>
                                    <li>Assistance with sudden illnesses</li>
                                </ul>
                            </CardContent>
                        </Card>
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
