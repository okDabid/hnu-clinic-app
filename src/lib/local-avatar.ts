import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

function isLocalAvatarPath(target?: string | null): target is string {
    return Boolean(target && target.startsWith("/uploads/avatars/"));
}

function buildAvatarFilename(userId: string, mime: string, base64: string) {
    const hash = crypto.createHash("md5").update(base64).digest("hex");
    const ext = mime.includes("png")
        ? "png"
        : mime.includes("jpeg") || mime.includes("jpg")
            ? "jpg"
            : mime.includes("gif")
                ? "gif"
                : "png";
    return `${userId}-${hash}.${ext}`;
}

export async function persistLocalAvatar(
    userId: string,
    dataUrl: string,
    previousPath?: string | null
): Promise<string> {
    const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid data URL for avatar");
    }

    const [, mime, base64] = match;
    const filename = buildAvatarFilename(userId, mime, base64);
    const relativePath = `/uploads/avatars/${filename}`;
    const absolutePath = path.join(AVATAR_DIR, filename);
    const buffer = Buffer.from(base64, "base64");

    await fs.mkdir(AVATAR_DIR, { recursive: true });
    await fs.writeFile(absolutePath, buffer);

    if (isLocalAvatarPath(previousPath) && previousPath !== relativePath) {
        try {
            await fs.unlink(path.join(process.cwd(), "public", previousPath));
        } catch (error) {
            // Best-effort cleanup — ignore missing files
            console.warn("[Local avatar] Failed to remove previous avatar", error);
        }
    }

    return relativePath;
}

export async function removeLocalAvatar(previousPath?: string | null) {
    if (!isLocalAvatarPath(previousPath)) return;

    try {
        await fs.unlink(path.join(process.cwd(), "public", previousPath));
    } catch (error) {
        console.warn("[Local avatar] Failed to delete avatar", error);
    }
}
