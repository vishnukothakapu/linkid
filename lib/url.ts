export function isValidHttpUrl(value: string) {
    try {
        const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(value);
        if (hasScheme && !/^https?:/i.test(value)) {
            return false;
        }
        const url = new URL(hasScheme ? value : `https://${value}`);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
