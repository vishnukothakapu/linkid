import { validateWebhookUrl } from "./ssrf";

export const WEBHOOK_TIMEOUT_MS = 10_000;

type WebhookDeliveryInput = {
    url: string;
    signature: string;
    body: unknown;
};

type WebhookDeliveryOptions = {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
};

/**
 * Deliver a signed webhook payload with a hard response deadline.
 *
 * Node's fetch has no default timeout. Without a signal, a receiver that
 * accepts the connection but never responds blocks the caller forever, which
 * in the worker means every other job stops behind it.
 */
export async function deliverWebhook(
    input: WebhookDeliveryInput,
    options: WebhookDeliveryOptions = {}
): Promise<void> {
    const fetchImpl = options.fetchImpl ?? fetch;
    const timeoutMs = options.timeoutMs ?? WEBHOOK_TIMEOUT_MS;

    await validateWebhookUrl(input.url);

    let response: Response;
    try {
        response = await fetchImpl(input.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-linkid-signature": input.signature,
            },
            body: JSON.stringify(input.body),
            redirect: "error",
            signal: AbortSignal.timeout(timeoutMs),
        });
    } catch (error) {
        if (
            error instanceof Error &&
            (error.name === "AbortError" || error.name === "TimeoutError")
        ) {
            throw new Error(`Webhook delivery timed out after ${timeoutMs}ms`);
        }
        throw error;
    }

    if (!response.ok) {
        throw new Error(`Webhook dispatch failed with status: ${response.status}`);
    }
}
