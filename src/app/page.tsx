"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, Loader2, ShieldCheck, Clock, MapPin } from "lucide-react";

// Lazy load lucide icons
const CalendarDays = dynamic(() => import("lucide-react").then(m => m.CalendarDays), { ssr: false });
const ClipboardList = dynamic(() => import("lucide-react").then(m => m.ClipboardList), { ssr: false });
const Stethoscope = dynamic(() => import("lucide-react").then(m => m.Stethoscope), { ssr: false });

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const navigation = [
    { href: "#features", label: "Features" },
    { href: "#workflow", label: "Workflow" },
    { href: "/about", label: "About" },
    { href: "#contact", label: "Contact" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Message sent successfully!", {
          description: "Thank you for contacting HNU Clinic. We'll get back to you soon.",
          duration: 5000,
        });
        setForm({ name: "", email: "", message: "" });
      } else {
        toast.error("❌ Failed to send message", {
          description: data.error || "Something went wrong. Please try again.",
          duration: 5000,
        });
      }
    } catch {
      toast.error("❌ Network Error", {
        description: "Unable to send message. Please check your connection and try again.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

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
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-gray-700 transition hover:text-green-600"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-2">
              <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-green-100/70 dark:hover:bg-emerald-500/20" />
              <Link href="/login">
                <Button className="bg-green-600 text-white shadow-sm hover:bg-green-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">Login</Button>
              </Link>
            </div>
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
          <div className="flex flex-col gap-3 px-4 pb-5 md:hidden bg-white/95 dark:bg-slate-900/95">
            {navigation.map((item) => (
              <Link key={item.label} href={item.href} className="text-gray-700 hover:text-green-600">
                {item.label}
              </Link>
            ))}
            <Link href="/login">
              <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">Login</Button>
            </Link>
            <ThemeToggle className="ml-auto border-none bg-transparent shadow-none hover:bg-green-100/70 dark:hover:bg-emerald-500/20" />
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-100 via-white to-green-50" />
        <div className="absolute inset-y-0 right-0 -z-10 h-full w-1/2 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_60%)]" />
        <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 gap-12">
          <div className="max-w-xl text-center md:text-left space-y-6">
            <span className="inline-flex items-center rounded-full bg-white shadow-sm border border-green-100 px-4 py-1 text-sm font-medium text-green-700">
              Comprehensive Care, Digitally Delivered
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-green-600 leading-tight">
              Manage health records, book visits, and stay connected to your care team.
            </h2>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed">
              The HNU Clinic platform streamlines appointments, consolidates health histories, and keeps patients informed every step of the way—securely and intuitively.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start w-full sm:w-auto">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md">
                  Book an Appointment
                </Button>
              </Link>
              <Link href="/learn-more" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-green-600 text-green-700 hover:bg-green-50"
                >
                  Explore the Platform
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left sm:text-center">
              {[{ label: "24/7 Portal Access", value: "Always on" }, { label: "Integrated Health Records", value: "Unified" }, { label: "Secure Patient Data", value: "Encrypted" }].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/80 border border-green-100 px-4 py-3 shadow-sm">
                  <p className="text-sm uppercase tracking-wide text-green-500 font-medium">{item.value}</p>
                  <p className="text-gray-700 text-sm">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center md:justify-end flex-1">
            <Image
              src="/header-illustration.svg"
              alt="Care team collaborating"
              width={800}
              height={600}
              priority
              className="w-full max-w-md md:max-w-lg lg:max-w-xl h-auto drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold text-green-600">Built for dependable clinic operations</h3>
            <p className="text-gray-600">
              HNU Clinic brings essential services together so patients and providers can focus on care—not coordination.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Easy Appointment Booking",
                description: "Schedule consultations on any device with reminders that keep everyone on time.",
                icon: CalendarDays,
              },
              {
                title: "Digital Health Records",
                description: "Securely review visit histories, medications, and notes from a single patient profile.",
                icon: ClipboardList,
              },
              {
                title: "Doctor–Patient Connection",
                description: "Give patients direct access to guidance and follow-up instructions from their care team.",
                icon: Stethoscope,
              },
              {
                title: "Protected Information",
                description: "Multi-layer safeguards protect sensitive data and keep compliance top of mind.",
                icon: ShieldCheck,
              },
              {
                title: "Coordinated Scheduling",
                description: "Align clinic calendars and staff assignments for efficient days.",
                icon: Clock,
              },
              {
                title: "Campus-Centered Care",
                description: "Support the Holy Name University community with services tailored to students and staff.",
                icon: MapPin,
              },
            ].map(({ title, description, icon: Icon }) => (
              <Card key={title} className="rounded-2xl border-green-100 shadow-sm hover:shadow-md transition">
                <CardHeader className="flex flex-col items-start gap-4">
                  <span className="inline-flex items-center justify-center rounded-full bg-green-50 p-3 text-green-600 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </span>
                  <CardTitle className="text-lg md:text-xl text-green-700">{title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-gray-600 text-sm md:text-base leading-relaxed">
                  {description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold text-green-600">A trusted pathway from booking to follow-up</h3>
            <p className="text-gray-600 leading-relaxed">
              Whether it is an annual assessment or urgent visit, the HNU Clinic workflow keeps each step organized so patients receive timely attention and healthcare teams have the insight they need.
            </p>
            <div className="grid gap-4">
              {["Reserve an appointment slot in minutes", "Arrive prepared with digital intake and reminders", "Receive coordinated care and documented outcomes"].map((step, index) => (
                <div key={step} className="flex items-start gap-4 rounded-xl bg-white/80 border border-green-100 p-4 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="rounded-3xl border-none bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white shadow-xl">
            <CardContent className="p-8 space-y-6">
              <h4 className="text-2xl font-semibold">Why patients trust the portal</h4>
              <ul className="space-y-4 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 mt-1" />
                  <span>Confidential information stays protected with modern security protocols.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-1" />
                  <span>Reduce waiting and keep appointments on schedule.</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1" />
                  <span>Designed specifically for the Holy Name University community and clinic operations.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-[1.2fr_1fr] items-center">
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold text-green-600">Let’s coordinate your next clinic visit</h3>
            <p className="text-gray-600 leading-relaxed">
              Share your details and our team will reach out with appointment options or answers to your questions. We’re here to support your wellness on campus.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-green-100 bg-white/80 p-4 text-left shadow-sm">
                <p className="text-xs uppercase tracking-wide text-green-700">Clinic Hours</p>
                <p className="text-sm text-gray-700">Monday – Friday, 7:30 AM – 8:00 PM</p>
                <p className="text-sm text-gray-700">Saturday, 8:00 AM – 11:00 AM</p>
              </div>
              <div className="rounded-xl border border-green-100 bg-white/80 p-4 text-left shadow-sm">
                <p className="text-xs uppercase tracking-wide text-green-700">Location</p>
                <p className="text-sm text-gray-700">Holy Name University campus clinic</p>
              </div>
            </div>
          </div>
          <Card className="rounded-2xl shadow-lg border-green-100 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6 md:p-8 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="name">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="email">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    placeholder="you@example.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="message">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="How can we help you?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full p-4 md:p-5 bg-green-600 hover:bg-green-700 flex items-center justify-center text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 mr-2 text-white" />
                      Sending...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-green-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <p className="text-lg font-semibold">HNU Clinic</p>
            <p className="text-sm text-green-100 leading-relaxed">
              Delivering compassionate, technology-enabled care to the Holy Name University community.
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
            <p className="text-lg font-semibold">Stay in Touch</p>
            <p className="text-sm text-green-100 leading-relaxed">
              Visit the campus clinic or send us a message and our staff will guide you to the right service.
            </p>
            <Link href="#contact" className="inline-flex text-sm text-white font-medium underline-offset-4 hover:underline">
              Contact the clinic team
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
