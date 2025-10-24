import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

function getPinSources() {
    const hash = process.env.ADMIN_ACCESS_PIN_HASH?.trim();
    const plain = process.env.ADMIN_ACCESS_PIN?.trim();
    return { hash: hash?.length ? hash : null, plain: plain?.length ? plain : null };
}

export async function POST(req: Request) {
    try {
        const { code } = (await req.json()) as { code?: unknown };
        const pin = typeof code === "string" ? code.trim() : "";

        if (!/^\d{6}$/.test(pin)) {
            return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
        }

        const { hash, plain } = getPinSources();
        if (!hash && !plain) {
            console.error("Missing ADMIN_ACCESS_PIN or ADMIN_ACCESS_PIN_HASH environment variable");
            return NextResponse.json(
                { error: "Access code is not configured" },
                { status: 500 }
            );
        }

        let isValid = false;
        if (hash) {
            try {
                isValid = await bcrypt.compare(pin, hash);
            } catch (err) {
                console.error("Failed to compare admin pin hash", err);
                return NextResponse.json(
                    { error: "Access code verification failed" },
                    { status: 500 }
                );
            }
        }

        if (!isValid && plain) {
            isValid = pin === plain;
        }

        if (!isValid) {
            return NextResponse.json({ error: "Incorrect access code" }, { status: 401 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[POST /api/auth/admin-pin]", error);
        return NextResponse.json({ error: "Unable to verify access code" }, { status: 500 });
    }
}
