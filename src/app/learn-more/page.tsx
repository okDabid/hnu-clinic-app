"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LearnMorePage() {
    return (
        <main className="flex flex-col min-h-screen bg-green-50">
            {/* Header Section */}
            <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
                <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold text-green-700 font-display">
                            Learn More About HNU Clinic
                        </h1>
                        <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                            The HNU Clinic Health Record & Appointment System was developed
                            to simplify patient care by integrating medical record management,
                            appointment scheduling, and doctor–patient communication in one
                            unified platform.
                        </p>
                        <Link href="/">
                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                                Back to Home
                            </Button>
                        </Link>
                    </div>

                    <div className="flex-1 flex justify-center md:justify-end">
                        <Image
                            src="/learn-more-illustration.svg"
                            alt="Learn more illustration"
                            width={600}
                            height={450}
                            className="w-full max-w-md md:max-w-lg h-auto"
                        />
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="bg-white py-16 md:py-20 px-6 md:px-12 border-t">
                <div className="max-w-6xl mx-auto space-y-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-green-700 font-display">
                        Our Mission
                    </h2>
                    <p className="text-gray-700 text-center max-w-3xl mx-auto text-base md:text-lg">
                        We aim to create a seamless experience for both patients and healthcare professionals at
                        HNU Clinic — ensuring efficient communication, secure record-keeping, and convenient
                        appointment booking through a user-friendly digital platform.
                    </p>
                </div>
            </section>

            {/* Core Features Section */}
            <section className="py-16 md:py-20 px-6 md:px-12 bg-green-50">
                <div className="max-w-7xl mx-auto text-center space-y-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-green-700 font-display">
                        Key Features
                    </h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
                        <Card className="rounded-xl shadow-sm hover:shadow-md transition">
                            <CardContent className="p-6 md:p-8 text-center space-y-3">
                                <h4 className="text-lg md:text-xl font-semibold text-green-600">
                                    Appointment Booking
                                </h4>
                                <p className="text-gray-600 text-sm md:text-base">
                                    Book, reschedule, or cancel appointments online with just a few clicks.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-xl shadow-sm hover:shadow-md transition">
                            <CardContent className="p-6 md:p-8 text-center space-y-3">
                                <h4 className="text-lg md:text-xl font-semibold text-green-600">
                                    Digital Health Records
                                </h4>
                                <p className="text-gray-600 text-sm md:text-base">
                                    Access, manage, and share your medical information securely anytime.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-xl shadow-sm hover:shadow-md transition">
                            <CardContent className="p-6 md:p-8 text-center space-y-3">
                                <h4 className="text-lg md:text-xl font-semibold text-green-600">
                                    Doctor–Patient Connection
                                </h4>
                                <p className="text-gray-600 text-sm md:text-base">
                                    Communicate with healthcare providers and receive updates easily.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Vision Section */}
            <section className="bg-white py-16 md:py-20 px-6 md:px-12 border-t">
                <div className="max-w-5xl mx-auto text-center space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-green-700 font-display">
                        Our Vision
                    </h2>
                    <p className="text-gray-700 text-base md:text-lg">
                        To promote digital healthcare transformation by integrating technology with compassion,
                        enabling patients to take charge of their health while empowering doctors to deliver
                        better care efficiently.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-green-50 py-6 text-center text-gray-600 text-sm md:text-base border-t">
                © {new Date().getFullYear()} HNU Clinic Capstone Project — Learn More
            </footer>
        </main>
    );
}
