"use client";

import { useEffect, useState } from "react";

export function NetworkStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const label = online === null ? "LOCAL-FIRST COMPANION" : online ? "NETWORK AVAILABLE · SAVED HERE" : "OFFLINE · QUESTS READY HERE";
  return (
    <div aria-live="polite" className={`network-status ${online === false ? "network-status-offline" : ""}`} role="status">
      <span aria-hidden="true" className="status-dot" /> {label}
    </div>
  );
}
