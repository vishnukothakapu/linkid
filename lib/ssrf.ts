import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

export class WebhookValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WebhookValidationError';
    }
}

export async function validateWebhookUrl(urlString: string): Promise<void> {
    let url: URL;
    try {
        url = new URL(urlString);
    } catch {
        throw new WebhookValidationError('Invalid URL format');
    }

    if (url.protocol !== 'https:') {
        throw new WebhookValidationError('Webhook URLs must use HTTPS');
    }

    // Resolve the hostname
    let addresses: { address: string; family: number }[] = [];
    try {
        addresses = await dns.lookup(url.hostname, { all: true });
    } catch (error) {
        throw new WebhookValidationError(`Could not resolve hostname: ${url.hostname}`);
    }

    if (addresses.length === 0) {
        throw new WebhookValidationError(`Could not resolve hostname: ${url.hostname}`);
    }

    for (const { address } of addresses) {
        if (!ipaddr.isValid(address)) {
            throw new WebhookValidationError(`Invalid IP address resolved: ${address}`);
        }

        const ip = ipaddr.parse(address);
        const range = ip.range();

        // Block all non-unicast or private ranges
        const blockedRanges = [
            'unspecified',
            'broadcast',
            'multicast',
            'linkLocal',
            'loopback',
            'private',
            'carrierGradeNat',
            'uniqueLocal',
            'ipv4Mapped',
            'rfc6145',
            'rfc6052',
            '6to4',
            'teredo'
        ];

        if (blockedRanges.includes(range)) {
            throw new WebhookValidationError(`Resolved IP address (${address}) is in a blocked range (${range})`);
        }

        // Specifically block AWS IMDS IPv4 (169.254.169.254) which might be covered by linkLocal
        if (address === '169.254.169.254') {
            throw new WebhookValidationError('Metadata service IP addresses are not allowed');
        }
    }
}
