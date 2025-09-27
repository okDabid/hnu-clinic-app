"use server";

import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export async function createUser(formData: FormData) {
    try {
        const role = formData.get("role") as string;
        const fname = formData.get("fname") as string;
        const mname = (formData.get("mname") as string) || null;
        const lname = formData.get("lname") as string;
        const dob = formData.get("date_of_birth") as string;
        const gender = formData.get("gender") as "Male" | "Female" | null;

        const student_id = (formData.get("student_id") as string) || "";
        const department = (formData.get("department") as string) || null;
        const program = (formData.get("program") as string) || null;
        const specialization = (formData.get("specialization") as string) || null;
        const year_level = (formData.get("year_level") as string) || null;

        const employee_id = (formData.get("employee_id") as string) || "";

        // 🟢 Generate credentials
        const randomNum = Math.floor(Math.random() * 100000);
        const username = `USER${String(randomNum).padStart(3, "0")}`;
        const rawPassword = Math.random().toString(36).substring(2, 10).toUpperCase();

        // 🟢 Hash password before saving
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 🟢 Create base user
        const user = await prisma.users.create({
            data: {
                username,
                password: hashedPassword,
                role,
                // default status = Active
                student: role === "Student" || role === "Working Scholar" ? {
                    create: {
                        student_id,
                        fname,
                        mname,
                        lname,
                        date_of_birth: dob ? new Date(dob) : new Date(),
                        gender: gender ?? "Male",
                        department,
                        program,
                        specialization,
                        year_level,
                        status: "Active",
                    }
                } : undefined,
                employee: role === "Faculty" || role === "Nurse" || role === "Doctor" ? {
                    create: {
                        employee_id,
                        fname,
                        mname,
                        lname,
                        date_of_birth: dob ? new Date(dob) : new Date(),
                        gender: gender ?? "Male",
                        status: "Active",
                    }
                } : undefined,
            },
        });

        return { username, password: rawPassword };
    } catch (err: unknown) {
        console.error("Error creating user:", err);

        if (err instanceof Error) {
            return { error: err.message };
        }
        return { error: "An unexpected error occurred" };
    }
}

// =============================
// Get all users (with names & IDs)
// =============================
export async function getUsers() {
    try {
        const users = await prisma.users.findMany({
            include: {
                student: true,
                employee: true,
            },
        });

        return users.map((u) => ({
            user_id: u.user_id,
            username: u.username,
            role: u.role,
            status: u.student
                ? u.student.status
                : u.employee
                    ? u.employee.status
                    : "Active",
            idNumber: u.student?.student_id || u.employee?.employee_id || "-",
            fullName: u.student
                ? `${u.student.fname} ${u.student.mname ?? ""} ${u.student.lname}`
                : u.employee
                    ? `${u.employee.fname} ${u.employee.mname ?? ""} ${u.employee.lname}`
                    : "",
        }));
    } catch (err) {
        console.error("Error fetching users:", err);
        return [];
    }
}

// =============================
// Toggle user status
// =============================
export async function toggleUserStatus(userId: string, newStatus: "Active" | "Inactive") {
    try {
        // try update student first
        const student = await prisma.student.findUnique({ where: { user_id: userId } });
        if (student) {
            await prisma.student.update({
                where: { user_id: userId },
                data: { status: newStatus },
            });
            return { success: true };
        }

        // otherwise update employee
        const employee = await prisma.employee.findUnique({ where: { user_id: userId } });
        if (employee) {
            await prisma.employee.update({
                where: { user_id: userId },
                data: { status: newStatus },
            });
            return { success: true };
        }

        return { error: "User not found" };
    } catch (err) {
        console.error("Error toggling status:", err);
        return { error: "Could not update status" };
    }
}
