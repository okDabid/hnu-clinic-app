"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createUser, getUsers, toggleUserStatus } from "../../actions";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type User = {
    user_id: string;
    username: string;
    role: string;
    status: "Active" | "Inactive";
    idNumber: string;
    fullName: string;
};

export default function AdminForm() {
    // -----------------
    // Form state
    // -----------------
    const [role, setRole] = useState("");
    const [gender, setGender] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // -----------------
    // User management state
    // -----------------
    const [users, setUsers] = useState<User[]>([]);

    // -----------------
    // Load users
    // -----------------
    async function loadUsers() {
        const data = await getUsers();
        setUsers(data);
    }

    useEffect(() => {
        loadUsers();
    }, []);

    // -----------------
    // Handle Submit (Create only)
    // -----------------
    async function handleSubmit(formData: FormData) {
        try {
            setIsLoading(true);
            const res = await createUser(formData);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success(
                    `✅ User created!\nUsername: ${res.username}\nPassword: ${res.password}`
                );
                loadUsers();
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    // -----------------
    // Handle Status Toggle
    // -----------------
    async function handleToggle(userId: string, current: "Active" | "Inactive") {
        const newStatus = current === "Active" ? "Inactive" : "Active";
        await toggleUserStatus(userId, newStatus);
        toast.success(`User ${newStatus}`);
        loadUsers();
    }

    // -----------------
    // Render
    // -----------------
    return (
        <div className="space-y-10">
            {/* --- Create User Form --- */}
            <Card className="w-full max-w-3xl shadow-xl">
                <CardHeader className="border-b pb-4">
                    <CardTitle className="text-2xl font-bold text-green-600">
                        Create New User
                    </CardTitle>
                </CardHeader>

                <CardContent className="pt-6">
                    <form action={handleSubmit} className="space-y-6">
                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={role}
                                onValueChange={(val) => setRole(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Working Scholar">Working Scholar</SelectItem>
                                    <SelectItem value="Nurse">Nurse</SelectItem>
                                    <SelectItem value="Doctor">Doctor</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="role" value={role} required />
                        </div>

                        {/* Employee ID (only for Nurse & Doctor) */}
                        {(role === "Nurse" || role === "Doctor") && (
                            <div className="space-y-2">
                                <Label htmlFor="employee_id">Employee ID</Label>
                                <Input name="employee_id" required />
                            </div>
                        )}

                        {/* Names */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fname">First Name</Label>
                                <Input name="fname" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mname">Middle Name</Label>
                                <Input name="mname" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lname">Last Name</Label>
                                <Input name="lname" required />
                            </div>
                        </div>

                        {/* DOB */}
                        <div className="space-y-2">
                            <Label htmlFor="date_of_birth">Date of Birth</Label>
                            <Input type="date" name="date_of_birth" required />
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="gender" value={gender} required />
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                            {isLoading ? "Creating..." : "Create User"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* --- Users Table --- */}
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-green-600">
                        Manage Existing Users
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.user_id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>{user.fullName}</TableCell>
                                    <TableCell
                                        className={
                                            user.status === "Active" ? "text-green-600" : "text-red-600"
                                        }
                                    >
                                        {user.status}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant={user.status === "Active" ? "destructive" : "default"}
                                            onClick={() => handleToggle(user.user_id, user.status)}
                                        >
                                            {user.status === "Active" ? "🚫 Deactivate" : "✅ Activate"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
