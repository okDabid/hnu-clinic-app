"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function NotFound() {
    const router = useRouter();

    function handleGoBack() {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/"); // fallback to home if no history
        }
    }

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
                <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleGoBack}
                >
                    Go Back
                </Button>
                <Button variant="outline" onClick={() => router.push("/login")}>
                    Login
                </Button>
            </div>
        </div>
    );
}
