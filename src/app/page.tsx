"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Menu, X } from "lucide-react";

// Lazy load icons to reduce initial JS bundle
const CalendarDays = dynamic(() => import("lucide-react").then(m => m.CalendarDays), { ssr: false });
const ClipboardList = dynamic(() => import("lucide-react").then(m => m.ClipboardList), { ssr: false });
const Stethoscope = dynamic(() => import("lucide-react").then(m => m.Stethoscope), { ssr: false });

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-green-50">
      {/* Header */}
      <header className="w-full bg-white shadow px-4 md:px-8 py-4 sticky top-0 z-50">
        <div className="flex justify-between items-center">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <Image
              src="/clinic-illustration.svg"
              alt="logo"
              width={48}
              height={48}
              priority
              className="md:w-16 md:h-16"
            />
            <h1 className="text-lg md:text-2xl font-bold text-green-600">HNU Clinic</h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-700 hover:text-green-600">Features</a>
            <a href="#about" className="text-gray-700 hover:text-green-600">About</a>
            <a href="#contact" className="text-gray-700 hover:text-green-600">Contact</a>
            <Link href="/login">
              <Button className="bg-green-600 hover:bg-green-700">Login</Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6 text-green-600" /> : <Menu className="w-6 h-6 text-green-600" />}
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        {menuOpen && (
          <div className="flex flex-col gap-4 mt-4 md:hidden">
            <a href="#features" className="text-gray-700 hover:text-green-600">Features</a>
            <a href="#about" className="text-gray-700 hover:text-green-600">About</a>
            <a href="#contact" className="text-gray-700 hover:text-green-600">Contact</a>
            <Link href="/login">
              <Button className="bg-green-600 hover:bg-green-700">Login</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-12 md:py-20 flex-grow gap-10">
        <div className="max-w-xl text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-bold text-green-500 mb-6 leading-tight">
            Manage Your Health Record & Appointments
          </h2>
          <p className="text-gray-700 mb-6 text-base md:text-lg">
            A secure and easy-to-use system for patients and doctors at HNU Clinic.
            Book appointments, access health records, and stay connected.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">Book Appointment</Button>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-16 md:py-20 px-6 md:px-12">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-green-500">Our Features</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 md:p-8 text-center">
              <CalendarDays className="w-10 h-10 md:w-12 md:h-12 mx-auto text-green-600 mb-4" />
              <h4 className="text-lg md:text-xl font-semibold mb-2">Easy Appointment Booking</h4>
              <p className="text-gray-600 text-sm md:text-base">Schedule your visit with just a few clicks, anytime and anywhere.</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 md:p-8 text-center">
              <ClipboardList className="w-10 h-10 md:w-12 md:h-12 mx-auto text-green-600 mb-4" />
              <h4 className="text-lg md:text-xl font-semibold mb-2">Digital Health Records</h4>
              <p className="text-gray-600 text-sm md:text-base">Access and manage your information securely in one place.</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 md:p-8 text-center">
              <Stethoscope className="w-10 h-10 md:w-12 md:h-12 mx-auto text-green-600 mb-4" />
              <h4 className="text-lg md:text-xl font-semibold mb-2">Doctor-Patient Connection</h4>
              <p className="text-gray-600 text-sm md:text-base">Stay in touch with the clinics healthcare providers for better care.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-20 px-6 md:px-12 bg-green-50">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-green-500">Get in Touch</h3>
        <div className="max-w-xl mx-auto space-y-4">
          <Input placeholder="Your Name" className="p-4 md:p-6" />
          <Input placeholder="Your Email" className="p-4 md:p-6" />
          <Input placeholder="Message" className="p-4 md:p-6" />
          <Button className="w-full p-4 md:p-6 bg-green-600 hover:bg-green-700">Send Message</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-6 text-center text-gray-600 text-sm md:text-base">
        © {new Date().getFullYear()} HNU Clinic Capstone Project
      </footer>
    </div>
  );
}
