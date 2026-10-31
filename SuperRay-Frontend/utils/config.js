const rawBackendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();

export const BACKEND_URL = rawBackendUrl && !rawBackendUrl.endsWith("/") ? `${rawBackendUrl}/` : rawBackendUrl;

// demo mode unless explicitly disabled with a backend configured
export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false" || !BACKEND_URL;

export const SOURCE_CODE_URL = "https://github.com/Hassan01SE/SuperRay";

export const MAX_UPLOAD_SIZE_MB = 10;
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"];
