export function isValidHttpUrl(value: string) {
    try {
        const url = new URL(value.startsWith("http") ? value : `https://${value}`);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
