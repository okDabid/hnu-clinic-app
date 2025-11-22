import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function buildImageResponse(imageData: string | null | undefined) {
    if (!imageData) return null;
    const dataUrlMatch = imageData.match(/^data:(.+);base64,(.*)$/);
    if (!dataUrlMatch) return null;

    const [, mime, base64] = dataUrlMatch;
    try {
        const buffer = Buffer.from(base64, "base64");
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": mime || "image/png",
                "Cache-Control": "no-store",
                "Content-Length": buffer.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error("[GET /api/profile/avatar] Failed to parse image", error);
        return null;
    }
}

export async function GET(
    _req: Request,
    { params }: { params: { userId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.userId;
    if (!userId) {
        return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    try {
        const user = await prisma.users.findUnique({
            where: { user_id: userId },
            select: { profile_image: true },
        });

        const response = buildImageResponse(user?.profile_image);
        if (!response) {
            return new NextResponse(null, { status: 204 });
        }

        return response;
    } catch (error) {
        console.error("[GET /api/profile/avatar/:userId]", error);
        return NextResponse.json({ error: "Failed to fetch avatar" }, { status: 500 });
    }
}
