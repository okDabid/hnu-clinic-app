import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customAlphabet, nanoid } from "nanoid";
import bcrypt from "bcryptjs";

// Password generator (8 chars, alphanumeric)
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const generatePassword = customAlphabet(alphabet, 8);

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Step 1: Generate a random password
        const plainPassword = generatePassword();

        // Step 2: Hash the password
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Step 3: Create a system username based on role
        let username: string;
        if (payload.role === "NURSE" || payload.role === "DOCTOR") {
            username = `${payload.employee_id}`;
        } else if (payload.role === "PATIENT" && payload.patientType === "student") {
            username = `${payload.student_id}`;
        } else if (payload.role === "PATIENT" && payload.patientType === "employee") {
            username = `${payload.employee_id}`;
        } else if (payload.role === "SCHOLAR") {
            username = `${payload.school_id}`;
        } else {
            username = `${payload.fname.toLowerCase()}.${payload.lname.toLowerCase()}`;
        }

        // Step 4: Create User account
        const newUser = await prisma.users.create({
            data: {
                username,
                password: hashedPassword, // ✅ hashed, not plain
                role: payload.role,
                status: "Active",
            },
        });

        // Step 5: Create linked profile
        if (payload.role === "PATIENT" && payload.patientType === "student") {
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: payload.student_id,
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
        }

        if (payload.role === "PATIENT" && payload.patientType === "employee") {
            await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: payload.employee_id,
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
        }

        if (payload.role === "NURSE" || payload.role === "DOCTOR") {
            await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: payload.employee_id,
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
        }

        if (payload.role === "SCHOLAR") {
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: payload.school_id, // use school_id as student_id
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
        }

        // Step 6: Return external ID + plain password once
        return NextResponse.json({
            id:
                payload.role === "PATIENT" && payload.patientType === "student"
                    ? payload.student_id
                    : (payload.role === "PATIENT" && payload.patientType === "employee") ||
                        payload.role === "NURSE" ||
                        payload.role === "DOCTOR"
                        ? payload.employee_id
                        : payload.role === "SCHOLAR"
                            ? payload.school_id
                            : newUser.username,
            password: plainPassword, // shown once, not stored
        });
    } catch (err) {
        console.error("[POST /api/nurse/accounts]", err);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const users = await prisma.users.findMany({
            include: {
                student: true,
                employee: true,
            },
        });

        const formatted = users.map((u) => {
            let displayId: string;

            if (u.role === "PATIENT") {
                // Patient → decide based on whether they're student or employee
                if (u.student) {
                    displayId = u.student.student_id;
                } else if (u.employee) {
                    displayId = u.employee.employee_id;
                } else {
                    displayId = u.username; // fallback if no linked record
                }
            } else if (u.role === "NURSE" || u.role === "DOCTOR") {
                // Nurses & Doctors → always use employee_id
                displayId = u.employee?.employee_id ?? u.username;
            } else if (u.role === "SCHOLAR") {
                // Scholars → use school_id stored as student_id
                displayId = u.student?.student_id ?? u.username;
            } else {
                // Admin/others → fallback to username
                displayId = u.username;
            }

            return {
                user_id: displayId,
                role: u.role,
                status: u.status,
                fullName:
                    u.student?.fname && u.student?.lname
                        ? `${u.student.fname} ${u.student.lname}`
                        : u.employee?.fname && u.employee?.lname
                            ? `${u.employee.fname} ${u.employee.lname}`
                            : u.username,
            };
        });

        return NextResponse.json(formatted);
    } catch (err) {
        console.error("[GET /api/nurse/accounts]", err);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const { userId, newStatus } = await req.json();

        await prisma.users.update({
            where: { username: userId }, // ✅ use username (unique)
            data: { status: newStatus },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/nurse/accounts]", err);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}
