import Link from "next/link";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/marketing/site-header";
import {
    HeartPulse,
    ShieldCheck,
    GraduationCap,
    UsersRound,
    Sparkles,
    Stethoscope,
} from "lucide-react";

const navigation = [
    { href: "/#features", label: "Features" },
    { href: "/#workflow", label: "Workflow" },
    { href: "/about", label: "About" },
    { href: "/learn-more", label: "Learn More" },
    { href: "/privacy", label: "Privacy" },
    { href: "/#contact", label: "Contact" },
];

export default function AboutPage() {

    const leadership = [
        {
            name: "Dr. Shanna Kathleen M. Escalona, MD",
            role: "Head, Health Services Department",
            img: "/profile/clinic/head-illustration.png",
            availability: "Monday to Friday • 2:00 PM – 5:00 PM",
        },
        {
            name: "Dr. Lovella I. Calvelo, MD",
            role: "School Physician",
            img: "/profile/clinic/physician-illustration.png",
            availability: "Monday to Friday • 8:00 AM – 11:00 PM",
        },
    ];

    const dentists = [
        {
            name: "Dr. Minette B. Barrete, DMD",
            role: "School Dentist",
            img: "/profile/clinic/dentist1-illustration.png",
            availability: "Monday to Saturday • 7:30 AM – 9:30 AM",
        },
        {
            name: "Dr. Roche T. Pamaran, DMD",
            role: "School Dentist",
            img: "/profile/clinic/dentist2-illustration.png",
            availability: "Monday to Saturday • 9:30 AM – 11:30 AM",
        },
    ];

    const nurses = [
        { name: "Cherly Marie B. Lagura, RN", role: "School Nurse", img: "/profile/clinic/nurse1-illustration.png" },
        { name: "Evangeline Y. Guieb, RN", role: "School Nurse", img: "/profile/clinic/nurse2-illustration.png" },
        { name: "Rhiza Rosario G. Magallones, RN", role: "School Nurse", img: "/profile/clinic/nurse3-illustration.png" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-linear-to-b from-primary/10 via-white to-primary/5">
            <SiteHeader navigation={navigation} />

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-white to-primary/5" />
                <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-24">
                    <div className="max-w-3xl space-y-6 text-center md:text-left">
                        <span className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                            Our Story
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold text-primary leading-tight">
                            Caring for the Holy Name University community with compassion and technology.
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                            HNU Clinic is the dedicated health partner for students, faculty, and staff. We blend professional expertise with digital tools that make every visit organized, respectful, and centered on well-being.
                        </p>
                    </div>
                    <div className="mt-12 grid gap-4 sm:grid-cols-3">
                        {[{
                            title: "Integrated Services",
                            description: "Medical, dental, and primary care working as one.",
                        }, {
                            title: "Collaborative Team",
                            description: "Doctors, dentists, and nurses aligned for each patient.",
                        }, {
                            title: "Guided by Care",
                            description: "Every interaction anchored in safety and respect.",
                        }].map((item) => (
                            <div key={item.title} className="rounded-2xl border border-primary/20 bg-white/80 p-5 text-center shadow-sm">
                                <p className="text-sm font-semibold text-primary">{item.title}</p>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="px-6 md:px-12 py-20">
                <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
                    {[
                        {
                            title: "Our Mission",
                            description:
                                "Provide timely, reliable care through innovation, collaboration, and a commitment to every patient’s well-being.",
                            icon: HeartPulse,
                        },
                        {
                            title: "Our Vision",
                            description:
                                "Be the trusted campus health partner delivering accessible, integrated, and forward-looking services for the HNU community.",
                            icon: ShieldCheck,
                        },
                    ].map(({ title, description, icon: Icon }) => (
                        <Card key={title} className="rounded-3xl border-primary/20 shadow-lg hover:-translate-y-1 hover:shadow-xl transition">
                            <CardHeader className="flex flex-col gap-4">
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                                    <Icon className="h-6 w-6" />
                                </span>
                                <CardTitle className="text-2xl font-semibold text-primary">{title}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 text-muted-foreground leading-relaxed">
                                {description}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Values */}
            <section className="px-6 md:px-12 py-20 bg-white/60">
                <div className="max-w-6xl mx-auto text-center space-y-6">
                    <span className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                        Our Pillars
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-primary">How we deliver patient-centered care</h2>
                    <p className="text-muted-foreground max-w-3xl mx-auto">
                        Every initiative at HNU Clinic is grounded in empathy, collaboration, and proactive wellness support for the campus.
                    </p>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[{
                            title: "Compassionate Service",
                            description: "Listening first and guiding patients with warmth and respect.",
                            icon: Sparkles,
                        }, {
                            title: "Expert Guidance",
                            description: "Empowering the community with clinical expertise and health education.",
                            icon: GraduationCap,
                        }, {
                            title: "Coordinated Support",
                            description: "Collaborating across disciplines to ensure continuous, safe care.",
                            icon: UsersRound,
                        }].map(({ title, description, icon: Icon }) => (
                            <Card key={title} className="rounded-2xl border-primary/20 shadow-md hover:-translate-y-1 hover:shadow-lg transition">
                                <CardHeader className="flex flex-col items-center gap-4 text-center">
                                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                                        <Icon className="h-6 w-6" />
                                    </span>
                                    <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
                                    {description}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="px-6 md:px-12 py-20 bg-primary/5">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <span className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                            Health Services Department
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-primary">
                            The team behind every HNU Clinic visit
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Our doctors, dentists, and nurses work side-by-side to deliver coordinated care and supportive guidance for the HNU community.
                        </p>
                    </div>

                    <div className="space-y-12">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4">
                                <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5" /> Clinic Leadership
                                </h3>
                                <span className="hidden text-sm text-primary md:block">Guiding daily health operations</span>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                {leadership.map((member) => (
                                    <Card key={member.name} className="rounded-2xl border-primary/20 bg-white/90 shadow-md">
                                        <CardContent className="flex items-center gap-4 p-6">
                                            <Image
                                                src={member.img}
                                                alt={member.name}
                                                width={96}
                                                height={96}
                                                className="h-24 w-24 rounded-full object-cover shadow"
                                            />
                                            <div className="space-y-1 text-left">
                                                <p className="text-base font-semibold text-primary">{member.name}</p>
                                                <p className="text-sm text-muted-foreground">{member.role}</p>
                                                {member.availability && (
                                                    <p className="text-xs font-medium text-primary/80">{member.availability}</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-primary">Dental Care</h3>
                            <div className="grid gap-6 sm:grid-cols-2">
                                {dentists.map((member) => (
                                    <Card key={member.name} className="rounded-2xl border-primary/20 bg-white/90 shadow-md">
                                        <CardContent className="flex items-center gap-4 p-6">
                                            <Image
                                                src={member.img}
                                                alt={member.name}
                                                width={96}
                                                height={96}
                                                className="h-24 w-24 rounded-full object-cover shadow"
                                            />
                                            <div className="space-y-1 text-left">
                                                <p className="text-base font-semibold text-primary">{member.name}</p>
                                                <p className="text-sm text-muted-foreground">{member.role}</p>
                                                {member.availability && (
                                                    <p className="text-xs font-medium text-primary/80">{member.availability}</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-primary">Nursing Team</h3>
                            <div className="grid gap-6 sm:grid-cols-3">
                                {nurses.map((member) => (
                                    <Card key={member.name} className="rounded-2xl border-primary/20 bg-white/90 shadow-sm">
                                        <CardContent className="flex flex-col items-center gap-4 p-6">
                                            <Image
                                                src={member.img}
                                                alt={member.name}
                                                width={110}
                                                height={110}
                                                className="h-24 w-24 rounded-full object-cover shadow"
                                            />
                                            <div className="text-center space-y-1">
                                                <p className="text-base font-semibold text-primary">{member.name}</p>
                                                <p className="text-sm text-muted-foreground">{member.role}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Services Section */}
            <section className="px-6 md:px-12 py-20 bg-white">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <span className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                            Core Programs
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-primary">Services that support the HNU community</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Our multidisciplinary team delivers coordinated services that cover assessments, preventive care, and responsive support.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {[{
                            title: "Health Assessment Program",
                            points: ["Physical examinations", "Consultations", "Medical certificate issuance"],
                        }, {
                            title: "Dental Program",
                            points: ["Consultations and examinations", "Oral prophylaxis", "Tooth extractions"],
                        }, {
                            title: "Primary Care Program",
                            points: ["Support for urgent medical needs", "Care for minor injuries", "Assistance with sudden illnesses"],
                        }].map((service) => (
                            <Card key={service.title} className="rounded-3xl border-primary/20 bg-white/90 shadow-lg hover:-translate-y-1 hover:shadow-xl transition">
                                <CardHeader>
                                    <CardTitle className="text-xl font-semibold text-primary">{service.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                                    <ul className="space-y-2">
                                        {service.points.map((point) => (
                                            <li key={point} className="flex items-start gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-primary text-primary-foreground">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid gap-8 md:grid-cols-3">
                    <div className="space-y-3">
                        <p className="text-lg font-semibold">HNU Clinic</p>
                        <p className="text-sm text-primary-foreground/80 leading-relaxed">
                            Dedicated to providing a safe and welcoming health experience for the Holy Name University community.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <p className="text-lg font-semibold">Quick Links</p>
                        <ul className="space-y-2 text-sm text-primary-foreground/80">
                            {navigation.map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="hover:text-primary-foreground transition">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <p className="text-lg font-semibold">Connect with Us</p>
                        <p className="text-sm text-primary-foreground/80 leading-relaxed">
                            Reach out to the clinic staff for guidance on scheduling, records, or wellness programs tailored to campus needs.
                        </p>
                        <Link href="/learn-more" className="inline-flex text-sm text-primary-foreground font-medium underline-offset-4 hover:underline">
                            Learn more about the system
                        </Link>
                    </div>
                </div>
                <div className="border-t border-primary-foreground/20 text-center py-4 text-xs text-primary-foreground/80">
                    © {new Date().getFullYear()} HNU Clinic Health Record &amp; Appointment System
                </div>
            </footer>
        </div>
    );
}
