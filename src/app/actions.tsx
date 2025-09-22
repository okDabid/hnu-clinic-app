"use server";

import prisma from "@/lib/db";

export async function createUser(formData: FormData) {
    try {
        const role = formData.get("role") as string;
        const fname = formData.get("fname") as string;
        const mname = (formData.get("mname") as string) || null;
        const lname = formData.get("lname") as string;
        const dob = formData.get("date_of_birth") as string;
        const gender = formData.get("gender") as "Male" | "Female" | null;

        // NEW: student-specific fields
        const student_id = (formData.get("student_id") as string) || "";
        const department = (formData.get("department") as string) || null;
        const program = (formData.get("program") as string) || null;
        const specialization = (formData.get("specialization") as string) || null;
        const year_level = (formData.get("year_level") as string) || null;

        // NEW: employee-specific field
        const employee_id = (formData.get("employee_id") as string) || "";

        // Generate a random number from 1 to 99999
        const randomNum = Math.floor(Math.random() * 100000);

        // Zero-pad to at least 3 digits (USER001, USER042, USER999, USER1234)
        const username = `USER${String(randomNum).padStart(3, "0")}`;
        const password = Math.random().toString(36).substring(2, 10).toUpperCase();

        // 1. Create the user in Users table
        const user = await prisma.users.create({
            data: {
                username,
                password,
                role,
            },
        });

        // 2. Insert into Student if Student / Working Scholar
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
                        connect: { user_id: user.user_id }, // connect relation properly
                    },
                },
            });
        }

        // 3. Insert into Employee if Faculty / Nurse / Doctor
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
                        connect: { user_id: user.user_id }, // connect relation properly
                    },
                },
            });
        }

        return { username, password };
    } catch (err: any) {
        console.error("Error creating user:", err);
        return { error: err.message };
    }
}
