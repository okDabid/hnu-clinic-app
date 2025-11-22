import crypto from "crypto";

/**
 * Builds a stable, cache-busting avatar URL for the given user.
 *
 * The returned URL points to the internal avatar endpoint and includes a hash of
 * the stored image contents, ensuring clients can refresh when the image
 * changes while keeping the exposed label short and clean.
 */
export function buildProfileImagePath(
    userId: string,
    imageData: string | null | undefined
): string | null {
    if (!imageData) return null;

    const normalized = imageData.trim();
    const hash = crypto.createHash("md5").update(normalized).digest("hex");

    // For remote URLs, serve the URL directly with a cache-busting version
    // so avatars load even when clients cannot call the internal avatar
    // endpoint (e.g., missing auth cookies on image fetches).
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
        const separator = normalized.includes("?") ? "&" : "?";
        return `${normalized}${separator}v=${hash}`;
    }

    // For embedded data URLs, keep routing through the avatar endpoint to
    // avoid pushing large base64 strings into client payloads while still
    // providing a stable, short label.
    if (normalized.startsWith("data:")) {
        return `/api/profile/avatar/${userId}?v=${hash}`;
    }

    // Fallback: return the raw value if it's already a short stored label.
    return normalized;
}
