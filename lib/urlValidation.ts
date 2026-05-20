export function validateUrl(url: string): { valid: true } | { valid: false; error: string } {
    const trimmed = url.trim();
    if (!trimmed) {
        return { valid: false, error: "Please enter a URL" };
    }

    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed);
    if (hasScheme && !/^https?:\/\//i.test(trimmed)) {
        return { valid: false, error: "Only http and https schemes are allowed" };
    }

    const withProtocol = hasScheme ? trimmed : `https://${trimmed}`;

    try {
        const parsed = new URL(withProtocol);
        const hostname = parsed.hostname;
        const parts = hostname.split(".");
        const tld = parts[parts.length - 1];

        // Ensure there are no empty parts (e.g., "google..com" or ".com" or "google.")
        if (parts.some(part => !part)) {
            return {
                valid: false,
                error: "Please enter a valid URL with a complete domain (e.g. domain.com)",
            };
        }

        if (parts.length < 2 || tld.length < 2 || !/^[a-zA-Z]{2,}$/.test(tld)) {
            return {
                valid: false,
                error: "Please enter a valid URL with a complete domain (e.g. domain.com)",
            };
        }

        return { valid: true };
    } catch {
        return {
            valid: false,
            error: "Please enter a valid URL",
        };
    }
}

export function validateUrlBackend(url: string): { valid: true; normalizedUrl: string } | { valid: false; error: string } {
    const tempUrl = url.trim();
    if (!tempUrl) {
        return { valid: false, error: "Please enter a URL" };
    }

    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(tempUrl);
    if (hasScheme && !/^https?:\/\//i.test(tempUrl)) {
        return { valid: false, error: "Only http and https schemes are allowed" };
    }

    const withProtocol = hasScheme ? tempUrl : `https://${tempUrl}`;

    try {
        const parsed = new URL(withProtocol);
        
        // Enforce allowed schemes (http/https)
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return { valid: false, error: "Only http and https schemes are allowed" };
        }

        const hostname = parsed.hostname;

        // Extract IPv4 if it's IPv4-mapped IPv6 (e.g., ::ffff:127.0.0.1)
        let checkHostname = hostname;
        if (hostname.startsWith("[") && hostname.endsWith("]")) {
            const rawIp = hostname.slice(1, -1).toLowerCase().trim();
            if (rawIp.startsWith("::ffff:")) {
                checkHostname = rawIp.slice(7);
            }
        }

        // Reject IPs in private/loopback ranges (IPv4)
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(checkHostname)) {
            const octets = checkHostname.split(".").map(Number);
            if (octets.some(o => o < 0 || o > 255)) {
                return { valid: false, error: "Invalid IP address" };
            }
            if (octets[0] === 127) {
                return { valid: false, error: "Loopback IP addresses are not allowed" };
            }
            if (octets[0] === 10) {
                return { valid: false, error: "Private IP addresses are not allowed" };
            }
            if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
                return { valid: false, error: "Private IP addresses are not allowed" };
            }
            if (octets[0] === 192 && octets[1] === 168) {
                return { valid: false, error: "Private IP addresses are not allowed" };
            }
            if (octets[0] === 169 && octets[1] === 254) {
                return { valid: false, error: "Link-local IP addresses are not allowed" };
            }
            return { valid: false, error: "IP addresses are not allowed as domains" };
        }

        // Reject IPs in private/loopback ranges (IPv6)
        if (hostname.startsWith("[") && hostname.endsWith("]")) {
            const ip = hostname.slice(1, -1).toLowerCase().trim();
            if (ip === "::1" || ip === "0:0:0:0:0:0:0:1" || ip === "::") {
                return { valid: false, error: "Loopback IP addresses are not allowed" };
            }
            if (ip.startsWith("fe80:") || ip.startsWith("fc00:") || ip.startsWith("fd00:")) {
                return { valid: false, error: "Private or link-local IP addresses are not allowed" };
            }
            return { valid: false, error: "IP addresses are not allowed as domains" };
        }

        // Ensure hostname has no empty parts and a valid TLD
        const parts = hostname.split(".");
        const tld = parts[parts.length - 1];

        if (parts.some(part => !part)) {
            return { valid: false, error: "Please enter a valid URL with a complete domain (e.g. domain.com)" };
        }

        if (parts.length < 2 || tld.length < 2 || !/^[a-zA-Z]{2,}$/.test(tld)) {
            return {
                valid: false,
                error: "Please enter a valid URL with a complete domain (e.g. domain.com)",
            };
        }

        // Sanitize & normalize URL by parsing and stripping trailing slash
        const normalizedUrl = parsed.toString().replace(/\/$/, "");

        return { valid: true, normalizedUrl };
    } catch {
        return {
            valid: false,
            error: "Please enter a valid URL",
        };
    }
}
