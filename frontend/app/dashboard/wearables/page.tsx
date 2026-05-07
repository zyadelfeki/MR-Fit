"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Snapshot = {
  data_type: string;
  payload: Record<string, unknown>;
  recorded_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  daily: "📊 Daily Activity",
  sleep: "💤 Sleep",
  body: "❤️ Body Metrics",
  activity: "🏃 Last Activity",
};

const FIELD_LABELS: Record<string, string> = {
  steps: "Steps",
  calories_burned: "Calories Burned (kcal)",
  active_minutes: "Active Minutes",
  distance_km: "Distance (km)",
  duration_hours: "Sleep Duration (hrs)",
  sleep_score: "Sleep Score",
  deep_sleep_hours: "Deep Sleep (hrs)",
  rem_sleep_hours: "REM Sleep (hrs)",
  resting_hr: "Resting Heart Rate (bpm)",
  hrv: "HRV (ms)",
  spo2: "SpO2 (%)",
  skin_temp_celsius: "Skin Temp (°C)",
  activity_type: "Activity Type",
  duration_minutes: "Duration (min)",
  avg_hr: "Avg HR (bpm)",
  calories: "Calories (kcal)",
};

export default function WearablesPage() {
  const { data: session } = useSession();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`http://localhost:8000/wearables/latest/${session.user.id}`)
      .then((r) => r.json())
      .then((d) => {
        setSnapshots(d.data || []);
        setConnected((d.data || []).length > 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2">Wearable Device</h1>
      <p className="text-muted-foreground mb-8">
        Connect your Apple Watch, Garmin, Oura Ring, or Whoop via{" "}
        <a
          href="http://localhost:4000"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary"
        >
          Open Wearables
        </a>
        . Your data is stored locally — never leaves your machine.
      </p>

      {/* Connection status */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-8 ${
          connected
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? "bg-green-500" : "bg-yellow-500"
          }`}
        />
        {connected ? "Device connected" : "No device connected"}
      </div>

      {/* Setup instructions if not connected */}
      {!connected && !loading && (
        <div className="border rounded-xl p-6 bg-muted/40 mb-8">
          <h2 className="font-semibold mb-3">How to connect</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Make sure Docker is running, then run:{" "}
              <code className="bg-muted px-1 rounded">cd open-wearables && docker compose up -d</code>
            </li>
            <li>
              Open{" "}
              <a
                href="http://localhost:4000"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                localhost:4000
              </a>{" "}
              and connect your device (Apple Health, Garmin, Oura, Whoop)
            </li>
            <li>Your data will appear here automatically</li>
          </ol>
        </div>
      )}

      {/* Data cards */}
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4">
          {snapshots.map((snap) => (
            <div key={snap.data_type} className="border rounded-xl p-5">
              <h2 className="font-semibold text-lg mb-3">
                {TYPE_LABELS[snap.data_type] ?? snap.data_type}
              </h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {Object.entries(snap.payload).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {FIELD_LABELS[key] ?? key}
                    </span>
                    <span className="font-medium">{String(val)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Last updated:{" "}
                {new Date(snap.recorded_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
