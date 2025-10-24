"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const LoaderIcon = dynamic(() => import("lucide-react").then((mod) => mod.Loader2), {
    ssr: false,
});

type ContactFormData = {
    name: string;
    email: string;
    message: string;
};

export function ContactForm() {
    const [form, setForm] = useState<ContactFormData>({ name: "", email: "", message: "" });
    const [submitting, setSubmitting] = useState(false);

    const updateField = (field: keyof ContactFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (response.ok) {
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
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Name
                </label>
                <Input id="name" value={form.name} onChange={updateField("name")} placeholder="Your name" required />
            </div>
            <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                </label>
                <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={updateField("email")}
                    placeholder="you@example.com"
                    required
                />
            </div>
            <div className="grid gap-2">
                <label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Message
                </label>
                <Textarea
                    id="message"
                    value={form.message}
                    onChange={updateField("message")}
                    placeholder="How can we help you?"
                    rows={4}
                    required
                />
            </div>
            <Button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white shadow-md"
            >
                {submitting ? (
                    <span className="flex items-center gap-2">
                        <LoaderIcon className="h-4 w-4 animate-spin" /> Sending
                    </span>
                ) : (
                    "Send message"
                )}
            </Button>
        </form>
    );
}
