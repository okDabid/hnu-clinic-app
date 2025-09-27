import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
    try {
        const { idNumber, password, role } = await req.json(); // role comes from LoginPage

        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    { username: idNumber },
                    { employee: { employee_id: idNumber } },
                    { student: { student_id: idNumber } },
                ],
            },
            include: { employee: true, student: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        // 🛑 Validate role (force correct login portal)
        if (user.role.toLowerCase() !== role.toLowerCase()) {
            return NextResponse.json(
                { error: `Your account is a ${user.role}, not a ${role}.` },
                { status: 403 }
            );
        }

        // 🟢 Issue JWT
        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: "1d" }
        );

        // 🟢 Redirects by role
        let redirect = "/";
        if (user.role === "Nurse") redirect = "/nurse/dashboard";
        if (user.role === "Doctor") redirect = "/doctor/dashboard";
        if (user.role === "Student" || user.role === "Employee") redirect = "/patient/dashboard";
        if (user.role === "Working Scholar") redirect = "/scholar/dashboard";

        return NextResponse.json({ token, redirect });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
