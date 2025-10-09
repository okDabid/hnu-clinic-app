"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Menu, X } from "lucide-react";

// Lazy load lucide icons
const CalendarDays = dynamic(() => import("lucide-react").then(m => m.CalendarDays), { ssr: false });
const ClipboardList = dynamic(() => import("lucide-react").then(m => m.ClipboardList), { ssr: false });
const Stethoscope = dynamic(() => import("lucide-react").then(m => m.Stethoscope), { ssr: false });
const [form, setForm] = useState({ name: "", email: "", message: "" });
const [loading, setLoading] = useState(false);
const [feedback, setFeedback] = useState("");

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setFeedback("");

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      setFeedback("✅ Message sent successfully!");
      setForm({ name: "", email: "", message: "" });
    } else {
      setFeedback(`❌ ${data.error || "Something went wrong"}`);
    }
  } catch {
    setFeedback("❌ Failed to send message. Please try again later.");
  } finally {
    setLoading(false);
  }
};

export default function HomePage() {
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
                className="md:w-14 md:h-14"
              />
            </Link>
            <h1 className="text-lg md:text-2xl font-bold text-green-600">HNU Clinic</h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="text-gray-700 hover:text-green-600 transition">Features</a>
            <a href="/about" className="text-gray-700 hover:text-green-600 transition">About</a>
            <a href="#contact" className="text-gray-700 hover:text-green-600 transition">Contact</a>
            <Link href="/login">
              <Button className="bg-green-600 hover:bg-green-700">Login</Button>
            </Link>
          </nav>

          {/* Mobile Nav Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6 text-green-600" /> : <Menu className="w-6 h-6 text-green-600" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="flex flex-col gap-3 px-4 pb-4 md:hidden">
            <a href="#features" className="text-gray-700 hover:text-green-600">Features</a>
            <a href="/about" className="text-gray-700 hover:text-green-600">About</a>
            <a href="#contact" className="text-gray-700 hover:text-green-600">Contact</a>
            <Link href="/login">
              <Button className="w-full bg-green-600 hover:bg-green-700">Login</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 flex-grow gap-10">
        <div className="max-w-xl text-center md:text-left space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold text-green-600 leading-tight">
            Manage Your Health Records & Appointments
          </h2>
          <p className="text-gray-700 text-base md:text-lg">
            A secure and easy-to-use system for patients and doctors at HNU Clinic.
            Book appointments, access health records, and stay connected.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                Book Appointment
              </Button>
            </Link>
            <Link href="/learn-more" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex justify-center md:justify-end flex-1">
          <Image
            src="/header-illustration.svg"
            alt="header illustration"
            width={800}
            height={600}
            priority
            className="w-full max-w-md md:max-w-lg lg:max-w-2xl h-auto"
          />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-green-600">
            Our Features
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            <Card className="rounded-xl shadow-sm hover:shadow-md transition">
              <CardContent className="p-6 md:p-8 text-center space-y-3">
                <CalendarDays className="w-10 h-10 md:w-12 md:h-12 mx-auto text-green-600" />
                <h4 className="text-lg md:text-xl font-semibold">Easy Appointment Booking</h4>
                <p className="text-gray-600 text-sm md:text-base">
                  Schedule your visit with just a few clicks, anytime and anywhere.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm hover:shadow-md transition">
              <CardContent className="p-6 md:p-8 text-center space-y-3">
                <ClipboardList className="w-10 h-10 md:w-12 md:h-12 mx-auto text-green-600" />
                <h4 className="text-lg md:text-xl font-semibold">Digital Health Records</h4>
                <p className="text-gray-600 text-sm md:text-base">
                  Access and manage your information securely in one place.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm hover:shadow-md transition">
              <CardContent className="p-6 md:p-8 text-center space-y-3">
                <Stethoscope className="w-10 h-10 md:w-12 md:h-12 mx-auto text-green-600" />
                <h4 className="text-lg md:text-xl font-semibold">Doctor-Patient Connection</h4>
                <p className="text-gray-600 text-sm md:text-base">
                  Stay in touch with healthcare providers for better care.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 md:py-20 px-6 md:px-12 bg-green-50">
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-green-600">
            Get in Touch
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Your Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full p-4 md:p-6 bg-green-600 hover:bg-green-700"
            >
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>
          {feedback && (
            <p className="text-center text-sm text-gray-700 mt-4">{feedback}</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-6 text-center text-gray-600 text-sm md:text-base border-t">
        © {new Date().getFullYear()} HNU Clinic Capstone Project
      </footer>
    </div>
  );
}
