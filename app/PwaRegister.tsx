"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    // Force registration on local dev server
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered: ", registration.scope);
          })
          .catch((error) => {
            console.error("Service Worker registration failed: ", error);
          });
      });
    }
  }, []);

  return null;
}

