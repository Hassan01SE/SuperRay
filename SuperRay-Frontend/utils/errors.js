export function describeApiError(error, fallback = "Something went wrong. Please try again.") {
    if (!error?.response) {
        if (error?.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
        return "The SuperRay server could not be reached. Please check your connection and try again.";
    }

    const { status, data } = error.response;
    if (data?.code === "not_medical_image") return "This doesn't look like a medical image. Please upload an X-ray or CT scan.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 404) return "The requested record was not found.";
    if (status === 413) return "The file is too large.";
    if (status === 429) return "Too many requests. Please wait a while before trying again.";
    if (status === 503) return "The AI inference service is currently unavailable.";
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.detail === "string") return data.detail;
    return fallback;
}

export function fieldErrors(error) {
    const data = error?.response?.data;
    if (!data || typeof data !== "object") return {};
    return Object.fromEntries(
        Object.entries(data).map(([field, messages]) => [field, Array.isArray(messages) ? messages.join(" ") : String(messages)])
    );
}
