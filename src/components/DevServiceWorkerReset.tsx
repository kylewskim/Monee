"use client";

import { useEffect } from "react";

export default function DevServiceWorkerReset() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    async function resetServiceWorker() {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        }

        if (!cancelled && navigator.serviceWorker.controller) {
          window.location.reload();
        }
      } catch {
        // Ignore reset failures in development.
      }
    }

    void resetServiceWorker();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

