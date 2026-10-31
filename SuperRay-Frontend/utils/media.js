import { BACKEND_URL } from "./config";

// prod returns absolute (signed) urls, a local backend returns /media/... paths
export function resolveMediaUrl(path) {
    if (!path) return null;
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    if (!BACKEND_URL) return null;
    try {
        return new URL(path, BACKEND_URL).toString();
    } catch {
        return null;
    }
}
