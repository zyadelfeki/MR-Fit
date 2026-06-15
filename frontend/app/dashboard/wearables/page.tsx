"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BarChart2, Moon, Heart, Activity, Check, AlertCircle, Loader2 } from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

type Snapshot = {
  data_type: string;
  payload: Record<string, unknown>;
  recorded_at: string;
};

type TypeConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TYPE_CONFIGS: Record<string, TypeConfig> = {
  daily: { label: "Daily Activity", icon: BarChart2 },
  sleep: { label: "Sleep", icon: Moon },
  body: { label: "Body Metrics", icon: Heart },
  activity: { label: "Last Activity", icon: Activity },
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
    fetch(`/api/wearables`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setSnapshots(d.data || []);
        setConnected((d.data || []).length > 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white font-heading">Wearable Device</h1>
        <p className="text-neutral-400 mt-2 text-sm">
          Connect your Apple Watch, Garmin, Oura Ring, or Whoop via{" "}
          <a
            href="http://localhost:4000"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[#FFB800]"
          >
            Open Wearables
          </a>
          . Your data is stored locally — never leaves your machine.
        </p>
      </div>

      {/* Connection status */}
      <div>
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            connected
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border border-amber-500/20 bg-amber-500/10 text-amber-405"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          {connected ? "Device connected" : "No device connected"}
        </div>
      </div>

      {/* Setup instructions if not connected */}
      {!connected && !loading && (
        <RevealOnScroll className="rounded-2xl border border-neutral-800 bg-[#161616] p-6">
          <h2 className="font-bold text-white text-base mb-3">How to connect</h2>
          <ol className="list-decimal list-inside space-y-2.5 text-sm text-neutral-300">
            <li>
              Make sure Docker is running, then execute:{" "}
              <code className="bg-neutral-900 border border-neutral-850 px-1.5 py-0.5 rounded text-xs text-[#FFB800]">cd open-wearables && docker compose up -d</code>
            </li>
            <li>
              Open{" "}
              <a
                href="http://localhost:4000"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#FFB800]"
              >
                localhost:4000
              </a>{" "}
              and connect your device (Apple Health, Garmin, Oura, Whoop)
            </li>
            <li>Your data will sync and appear here automatically</li>
          </ol>
        </RevealOnScroll>
      )}

      {/* Data cards */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-450 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[#FFB800]" />
          <span>Loading wearable snapshots...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {snapshots.map((snap) => {
            const config = TYPE_CONFIGS[snap.data_type];
            const IconComponent = config?.icon || Activity;
            return (
              <div key={snap.data_type} className="rounded-2xl border border-neutral-800 bg-[#161616] p-5 shadow-sm space-y-3">
                <h2 className="font-bold text-base text-white flex items-center gap-1.5 font-heading">
                  <IconComponent className="h-4 w-4 text-[#FFB800]" />
                  <span>{config?.label ?? snap.data_type}</span>
                </h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-neutral-850 pt-3">
                  {Object.entries(snap.payload).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs py-1 border-b border-neutral-850/30">
                      <span className="text-neutral-400">
                        {FIELD_LABELS[key] ?? key}
                      </span>
                      <span className="font-semibold text-white">{String(val)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-500 mt-2 uppercase tracking-wide">
                  Last updated:{" "}
                  {new Date(snap.recorded_at).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
