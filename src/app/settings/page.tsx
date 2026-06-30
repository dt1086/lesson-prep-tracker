"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function SettingsContent() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const params = useSearchParams();
  const googleError = params.get("google_error");
  const justConnected = params.get("google_connected");

  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then((data) => setConnected(data.connected))
      .catch(() => setConnected(false));
  }, [justConnected]);

  return (
    <div className="rounded-lg border border-card-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-medium text-muted">Google Calendar</h2>

      {googleError && (
        <p className="text-sm text-red-400">Connection failed: {googleError}</p>
      )}
      {justConnected && (
        <p className="text-sm text-accent">Google Calendar connected.</p>
      )}

      {connected === null ? (
        <p className="text-sm text-muted">Checking connection...</p>
      ) : connected ? (
        <p className="text-sm text-foreground">
          ✓ Connected. Sessions will sync from your primary calendar.
        </p>
      ) : (
        <p className="text-sm text-muted">Not connected yet.</p>
      )}

      <a
        href="/api/auth/google"
        className="inline-block rounded-md bg-accent text-background px-3 py-1.5 text-sm font-medium hover:bg-accent-dim"
      >
        {connected ? "Reconnect" : "Connect Google Calendar"}
      </a>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
