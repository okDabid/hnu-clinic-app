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
                password: hashedPassword, // save hash instead of plain
                role,
            },
        });

        // Student / Working Scholar
        if (role === "Student" || role === "Working Scholar") {
            await prisma.student.create({
                data: {
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
                    user: {
                        connect: { user_id: user.user_id },
                    },
                },
            });
        }

        // Faculty / Nurse / Doctor
        if (role === "Faculty" || role === "Nurse" || role === "Doctor") {
            await prisma.employee.create({
                data: {
                    employee_id,
                    fname,
                    mname,
                    lname,
                    date_of_birth: dob ? new Date(dob) : new Date(),
                    gender: gender ?? "Male",
                    user: {
                        connect: { user_id: user.user_id },
                    },
                },
            });
        }

        // 🟢 Return username + raw password so you can show it in toast
        return { username, password: rawPassword };
    } catch (err: unknown) {
        console.error("Error creating user:", err);

        if (err instanceof Error) {
            return { error: err.message };
        }
        return { error: "An unexpected error occurred" };
    }
}
