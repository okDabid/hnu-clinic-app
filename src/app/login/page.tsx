"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function LoginPage() {
    const [role, setRole] = useState("doctor");

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6">
            {/* Logo + Title */}
            <div className="flex items-center gap-3 mb-8">
                <Image src="/clinic-illustration.svg" alt="logo" width={50} height={50} />
                <h1 className="text-2xl md:text-3xl font-bold text-green-600">HNU Clinic Login</h1>
            </div>

            {/* Login Card */}
            <Card className="w-full max-w-md shadow-lg rounded-2xl">
                <CardContent className="p-6">
                    {/* Role Tabs */}
                    <Tabs defaultValue="doctor" onValueChange={setRole} className="w-full">
                        <TabsList className="flex flex-wrap w-full mb-6 bg-muted p-1 rounded-lg gap-2">
                            <TabsTrigger value="doctor">Doctor</TabsTrigger>
                            <TabsTrigger value="nurse">Nurse</TabsTrigger>
                            <TabsTrigger value="scholar">Scholar</TabsTrigger>
                            <TabsTrigger value="patient">Patient</TabsTrigger>
                        </TabsList>

                        <TabsContent value="doctor">
                            <form className="space-y-4">
                                <Input placeholder="Employee Id" type="email" />
                                <Input placeholder="Password" type="password" />
                                <Button className="w-full bg-green-600 hover:bg-green-700">Login as Doctor</Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="nurse">
                            <form className="space-y-4">
                                <Input placeholder="Employee Id" type="email" />
                                <Input placeholder="Password" type="password" />
                                <Button className="w-full bg-green-600 hover:bg-green-700">Login as Nurse</Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="scholar">
                            <form className="space-y-4">
                                <Input placeholder="School Id" type="email" />
                                <Input placeholder="Password" type="password" />
                                <Button className="w-full bg-green-600 hover:bg-green-700">Login as Scholar</Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="patient">
                            <form className="space-y-4">
                                <Input placeholder="School Id" type="email" />
                                <Input placeholder="Password" type="password" />
                                <Button className="w-full bg-green-600 hover:bg-green-700">Login as Patient</Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <p className="text-gray-600 text-sm mt-6">
                © {new Date().getFullYear()} HNU Clinic Capstone Project
            </p>
        </div>
    );
}
