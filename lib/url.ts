export function isValidHttpUrl(value: string) {
    try {
        // 1. Add https:// if the user didn't provide a protocol
        const urlString = value.includes("://") ? value : `https://${value}`;
        const url = new URL(urlString);
        
        // 2. Validate it's either http or https
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        // If the URL constructor throws an error, it's invalid
        return false;
    }
}