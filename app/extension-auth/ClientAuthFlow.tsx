"use client";

import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

declare var chrome: any;

function AuthFlowComponent({ username }: { username: string }) {
  const searchParams = useSearchParams();
  const extId = searchParams.get("extId");
  const [status, setStatus] = useState<"idle" | "connecting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleConnect = async () => {
    if (!extId) {
      setStatus("error");
      setErrorMsg("Missing Extension ID.");
      return;
    }

    setStatus("connecting");

    try {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error("Chrome runtime not available. Make sure you are using Chrome and the extension is installed.");
      }

      chrome.runtime.sendMessage(
        extId,
        { type: "LINKID_CONNECT", username },
        (response: any) => {
          if (chrome.runtime.lastError) {
             setStatus("error");
             setErrorMsg(chrome.runtime.lastError.message || "Failed to communicate with extension.");
             return;
          }
          if (response && response.success) {
            setStatus("success");
          } else {
            setStatus("error");
            setErrorMsg("Extension rejected the connection.");
          }
        }
      );
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "An unexpected error occurred.");
    }
  };

  if (!extId) {
    return (
      <div className="text-center">
         <p className="text-zinc-500 dark:text-zinc-400">
           Invalid request. Missing extension ID in URL.
         </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Connection Successful!</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            LinkID is now connected to your Chrome Extension. You can safely close this tab and open the extension.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-8">
      <div>
         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
            <ShieldCheck className="h-8 w-8" />
         </div>
         <h2 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">Connect Chrome Extension</h2>
         <p className="mt-2 text-zinc-600 dark:text-zinc-400">
           Authorize the LinkID Auto-Fill extension to access your profile <strong>@{username}</strong>.
         </p>
      </div>

      {status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      <Button
        onClick={handleConnect}
        disabled={status === "connecting"}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 py-6 text-base font-semibold text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all"
      >
        {status === "connecting" ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Connecting...
          </>
        ) : (
          "Approve Connection"
        )}
      </Button>
    </div>
  );
}

export default function ClientAuthFlow({ username }: { username: string }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthFlowComponent username={username} />
    </Suspense>
  );
}
