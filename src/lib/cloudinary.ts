import crypto from "crypto";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export type CloudinaryUploadResult = {
    secure_url?: string;
    public_id?: string;
};

function assertCloudinaryConfig() {
    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary environment variables are missing");
    }
}

function buildSignature(params: Record<string, string>) {
    const sortedKeys = Object.keys(params).sort();
    const toSign = sortedKeys
        .map((key) => `${key}=${params[key]}`)
        .join("&");
    return crypto.createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

export function extractPublicIdFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        const parts = parsed.pathname.split("/").filter(Boolean);
        const uploadIndex = parts.findIndex((part) => part === "upload");
        if (uploadIndex === -1) return null;
        const publicIdParts = parts.slice(uploadIndex + 1);
        const withoutVersion = publicIdParts[0]?.startsWith("v")
            ? publicIdParts.slice(1)
            : publicIdParts;
        if (!withoutVersion.length) return null;
        const filename = withoutVersion.join("/");
        return decodeURIComponent(filename.replace(/\.[^./]+$/, ""));
    } catch (error) {
        console.error("[Cloudinary] Failed to parse public id", error);
        return null;
    }
}

export async function uploadDataUrlToCloudinary(
    dataUrl: string,
    userId: string
): Promise<CloudinaryUploadResult> {
    assertCloudinaryConfig();
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "hnu-clinic-app/avatars";
    const publicId = `user_${userId}`;
    const signature = buildSignature({
        folder,
        public_id: publicId,
        timestamp: String(timestamp),
    });

    const form = new FormData();
    form.append("file", dataUrl);
    form.append("api_key", apiKey!);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
    form.append("folder", folder);
    form.append("public_id", publicId);
    form.append("overwrite", "true");
    form.append("invalidate", "true");

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: form }
    );

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    return (await res.json()) as CloudinaryUploadResult;
}

export async function deleteCloudinaryImage(publicId: string) {
    assertCloudinaryConfig();
    const timestamp = Math.round(Date.now() / 1000);
    const signature = buildSignature({
        public_id: publicId,
        timestamp: String(timestamp),
    });

    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", apiKey!);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        { method: "POST", body: form }
    );

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Cloudinary delete failed: ${errorText}`);
    }

    return res.json();
}
