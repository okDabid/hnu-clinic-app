import { NextResponse } from "next/server";

import { resolvePatientCertificate } from "./certificate-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const result = await resolvePatientCertificate();

    if (result === null) {
        return NextResponse.json({ certificate: null }, { status: 200 });
    }

    if (result instanceof NextResponse) {
        return result;
    }

    return NextResponse.json({ certificate: result.payload });
}

