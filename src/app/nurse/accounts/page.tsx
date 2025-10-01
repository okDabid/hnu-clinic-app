"use client";

import { useEffect, useState } from "react";
import orderBy from "lodash/orderBy"; // ✅ lodash for sorting
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Loader2, Ban, CheckCircle2, Search } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types
type User = {
    user_id: string;
    username: string;
    role: string;
    status: "Active" | "Inactive";
    fullName: string;
};

export default function NurseAccountsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState(""); // 🔎 search query

    // 🔹 Fetch users
    async function loadUsers() {
        try {
            const res = await fetch("/api/nurse/accounts", { cache: "no-store" });
            const data = await res.json();

            const sorted = orderBy(
                data,
                [
                    (u) => u.role, // sort by role
                    (u) => {
                        const n = parseInt(u.user_id, 10);
                        return isNaN(n) ? u.user_id : n;
                    },
                ],
                ["asc", "asc"]
            );

            setUsers(sorted);
        } catch {
            toast.error("Failed to load users", { position: "top-center" });
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    // 🔎 Filtered + sorted users
    const filteredUsers = users.filter(
        (u) =>
            u.user_id.toLowerCase().includes(search.toLowerCase()) ||
            u.role.toLowerCase().includes(search.toLowerCase()) ||
            u.fullName.toLowerCase().includes(search.toLowerCase())
    );

    // 🔹 Toggle status
    async function handleToggle(userId: string, current: "Active" | "Inactive") {
        const newStatus = current === "Active" ? "Inactive" : "Active";
        try {
            await fetch("/api/nurse/accounts", {
                method: "PUT",
                body: JSON.stringify({ userId, newStatus }),
                headers: { "Content-Type": "application/json" },
            });
            toast.success(`User ${newStatus}`, { position: "top-center" });
            loadUsers();
        } catch {
            toast.error("Failed to update user status", { position: "top-center" });
        }
    }

    return (
        <Card className="shadow-xl">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="text-2xl font-bold text-green-600">
                    Manage Existing Users
                </CardTitle>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by ID, role, or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User ID</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.user_id}>
                                        <TableCell className="font-medium">
                                            {user.user_id}
                                        </TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>{user.fullName}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    user.status === "Active"
                                                        ? "bg-green-100 text-green-700 border-green-200 px-4 py-1"
                                                        : "bg-red-100 text-red-700 border-red-200 px-4 py-1"
                                                }
                                            >
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant={
                                                            user.status === "Active"
                                                                ? "destructive"
                                                                : "default"
                                                        }
                                                        className="gap-2"
                                                    >
                                                        {user.status === "Active" ? (
                                                            <>
                                                                <Ban className="h-4 w-4" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            {user.status === "Active"
                                                                ? "Deactivate user?"
                                                                : "Activate user?"}
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {user.status === "Active"
                                                                ? "This will prevent the user from signing in until reactivated."
                                                                : "This will allow the user to sign in and use the system."}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className={
                                                                user.status === "Active"
                                                                    ? "bg-red-600 hover:bg-red-700"
                                                                    : "bg-green-600 hover:bg-green-700"
                                                            }
                                                            onClick={() =>
                                                                handleToggle(
                                                                    user.user_id,
                                                                    user.status
                                                                )
                                                            }
                                                        >
                                                            {user.status === "Active"
                                                                ? "Confirm Deactivate"
                                                                : "Confirm Activate"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center text-gray-500 py-6"
                                    >
                                        No users found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
