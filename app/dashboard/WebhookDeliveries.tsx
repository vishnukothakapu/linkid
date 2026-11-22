"use client";
import { useEffect, useState } from "react";
import { getCsrfToken } from "@/lib/csrfClient";
type Delivery = {
  id: string;
  eventId: string;
  event: string;
  status: string;
  statusCode: number | null;
  durationMs: number | null;
  error: string | null;
  attempt: number;
  createdAt: string;
  requestBody: unknown;
  responseBody: string | null;
};
export function WebhookDeliveries({ workspaceId }: { workspaceId: string }) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]),
    [error, setError] = useState(""),
    [result, setResult] = useState(""),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/settings/webhook/deliveries", {
          headers: { "x-workspace-id": workspaceId },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (active) {
          setDeliveries(data.deliveries);
          setError("");
        }
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Could not load deliveries",
          );
      }
    };
    void load();
    const timer = setInterval(() => void load(), 15_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [workspaceId, refresh]);
  const ping = async () => {
    setBusy(true);
    setResult("");
    try {
      const response = await fetch("/api/settings/webhook/test", {
        method: "POST",
        headers: {
          "x-workspace-id": workspaceId,
          "x-csrf-token": await getCsrfToken(),
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(
        `${data.result.status} · ${data.result.statusCode ?? "No HTTP response"} · ${data.result.durationMs} ms${data.result.error ? " · " + data.result.error : ""}`,
      );
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Test request failed");
    } finally {
      setBusy(false);
      setRefresh((value) => value + 1);
    }
  };
  return (
    <section className="mt-6 space-y-4">
      <h3 className="font-semibold">Delivery diagnostics</h3>
      <div className="flex gap-4">
        <button
          className="border rounded px-3 py-2"
          disabled={busy}
          onClick={() => void ping()}
        >
          {busy ? "Testing…" : "Send Test Webhook"}
        </button>
        <button onClick={() => setRefresh((value) => value + 1)}>
          Refresh deliveries
        </button>
      </div>
      {result && <p role="status">{result}</p>}
      {error && <p role="alert">{error}</p>}
      <p className="text-sm text-muted-foreground">
        Latest 10 attempts. Events use stable delivery IDs; receivers should
        deduplicate retries.
      </p>
      <ul className="space-y-3">
        {deliveries.map((delivery) => (
          <li key={delivery.id} className="border rounded p-3">
            <p>
              {delivery.event} · {delivery.status} ·{" "}
              {delivery.statusCode ?? "No response"} · {delivery.durationMs} ms
            </p>
            <p>
              Attempt {delivery.attempt} ·{" "}
              {new Date(delivery.createdAt).toLocaleString()}
            </p>
            {delivery.error && <p>{delivery.error}</p>}
            <details>
              <summary>Inspect event and response</summary>
              <pre className="overflow-auto whitespace-pre-wrap break-all text-xs">
                {JSON.stringify(delivery.requestBody, null, 2)}
              </pre>
              <pre className="overflow-auto whitespace-pre-wrap break-all text-xs">
                {delivery.responseBody}
              </pre>
            </details>
          </li>
        ))}
      </ul>
      {!error && !deliveries.length && (
        <p>
          No delivery attempts yet. Send a test to check the configured
          endpoint.
        </p>
      )}
    </section>
  );
}
