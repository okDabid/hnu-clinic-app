"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 px-6">
            {/* Illustration */}
            <Image
                src="/clinic-illustration.svg"
                alt="HNU Clinic"
                width={200}
                height={200}
                className="mb-6"
            />

            {/* Error Message */}
            <h1 className="text-6xl font-bold text-green-600 mb-4">404</h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
                Oops! Page Not Found
            </h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
                The page you are looking for doesn’t exist at HNU Clinic.
                Maybe you mistyped the URL, or the page has been moved.
            </p>

            {/* Buttons */}
            <div className="flex flex-row gap-4 justify-center">
                <Link href="/">
                    <Button className="bg-green-600 hover:bg-green-700">
                        Go Back Home
                    </Button>
                </Link>
                <Link href="/login">
                    <Button variant="outline">
                        Login
                    </Button>
                </Link>
            </div>
        </div>
    );
}
