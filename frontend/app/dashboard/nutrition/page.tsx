"use client";

import { useState, useEffect, useRef } from "react";
import { showToast } from "@/lib/toast";
import Link from "next/link";
import {
  Camera,
  Trash2,
  X,
  RefreshCw,
  Check,
  Salad,
  Search,
  AlertCircle,
  Plus,
  ChevronDown,
  Upload,
} from "lucide-react";

type NutritionLog = {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_at: string;
};

type FoodResult = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
};

type DailySummary = {
  totals: { calories: number; protein: number; carbs: number; fat: number };
  goals: { calories: number; protein: number; carbs: number; fat: number };
};

const DEFAULT_SUMMARY: DailySummary = {
  totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  goals: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
};

const toRounded = (v: number) => Math.round(v * 10) / 10;

type MealGroup = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

function getMealGroup(loggedAt: string): MealGroup {
  const h = new Date(loggedAt).getHours();
  if (h < 10) return "Breakfast";
  if (h < 15) return "Lunch";
  if (h < 20) return "Dinner";
  return "Snacks";
}

export default function NutritionPage() {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DailySummary>(DEFAULT_SUMMARY);
  const [openGroups, setOpenGroups] = useState<Record<MealGroup, boolean>>({
    Breakfast: true,
    Lunch: true,
    Dinner: true,
    Snacks: true,
  });

  // Scanner States & Logic
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<FoodResult | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // base64 data URL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const startCamera = async () => {
    setScannerOpen(true);
    setScanResult(null);
    setUploadedImage(null);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setCameraStream(stream);
      } catch (e) {
        console.warn("Webcam access not granted.");
      }
    }, 100);
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setUploadedImage(null);
    setScanResult(null);
    setScannerOpen(false);
  };

  /** Convert a File to a base64 data URL */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Stop live webcam if active
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setScanResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  /** Capture current video frame as base64 using an off-screen canvas */
  const captureFrameBase64 = (): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const handleScanImage = async () => {
    let imageData: string | null = null;
    let mimeType = "image/jpeg";

    if (uploadedImage) {
      imageData = uploadedImage;
      // Detect mime from data URL header
      const match = uploadedImage.match(/^data:(image\/[a-z]+);base64,/);
      if (match) mimeType = match[1];
    } else if (cameraStream) {
      imageData = captureFrameBase64();
    }

    if (!imageData) {
      showToast("No image source — upload an image or allow camera access.", "error");
      return;
    }

    setScanLoading(true);
    try {
      const res = await fetch("/api/nutrition/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, mime_type: mimeType }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Scan failed");
      }
      const data = await res.json();
      setScanResult(data.food);
    } catch (err: any) {
      showToast(err.message || "Scanner failed", "error");
    } finally {
      setScanLoading(false);
    }
  };

  const acceptScan = () => {
    if (scanResult) {
      setFoodName(scanResult.name);
      setCalories(scanResult.calories);
      setProtein(scanResult.protein);
      setCarbs(scanResult.carbs);
      setFats(scanResult.fat);
      stopCamera();
      showToast("Scanner filled form details", "success");
    }
  };

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Form
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState<number | "">("");
  const [protein, setProtein] = useState<number | "">("");
  const [carbs, setCarbs] = useState<number | "">("");
  const [fats, setFats] = useState<number | "">("");
  const [loggedDate, setLoggedDate] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/nutrition");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch {
      setError("Failed to load nutrition logs.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async () => {
    try {
      const res = await fetch("/api/nutrition/daily-summary", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as DailySummary;
      setSummary({
        totals: {
          calories: Number(data.totals?.calories ?? 0),
          protein: Number(data.totals?.protein ?? 0),
          carbs: Number(data.totals?.carbs ?? 0),
          fat: Number(data.totals?.fat ?? 0),
        },
        goals: {
          calories: Number(data.goals?.calories ?? 2000),
          protein: Number(data.goals?.protein ?? 150),
          carbs: Number(data.goals?.carbs ?? 250),
          fat: Number(data.goals?.fat ?? 65),
        },
      });
    } catch {
      setSummary(DEFAULT_SUMMARY);
    }
  };

  const refresh = async () => {
    await Promise.all([fetchLogs(), fetchDailySummary()]);
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);
        const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(trimmed)}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as { foods?: FoodResult[]; error?: string };
        setSearchResults(data.foods ?? []);
        if (data.error) setSearchError(data.error);
      } catch {
        setSearchResults([]);
        setSearchError("Search unavailable");
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const selectFood = (food: FoodResult) => {
    setFoodName(food.name);
    setCalories(food.calories);
    setProtein(food.protein);
    setCarbs(food.carbs);
    setFats(food.fat);
    setSearchQuery(food.name);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || calories === "" || calories < 1) {
      setError("Please provide a valid food name and calories.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          food_name: foodName,
          calories: Number(calories),
          protein_g: protein === "" ? null : Number(protein),
          carbs_g: carbs === "" ? null : Number(carbs),
          fat_g: fats === "" ? null : Number(fats),
          logged_at: new Date(loggedDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log food");

      // reset form
      setFoodName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      setSearchQuery("");
      showToast("Logged successfully", "success");
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/nutrition?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Deleted successfully", "success");
      await refresh();
    } catch {
      showToast("Failed to delete log", "error");
    }
  };

  const MEAL_ORDER: MealGroup[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];
  const grouped: Record<MealGroup, NutritionLog[]> = {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snacks: [],
  };
  logs.forEach((log) => {
    const grp = getMealGroup(log.logged_at);
    grouped[grp].push(log);
  });

  const macros = [
    {
      label: "Calories",
      total: summary.totals.calories,
      goal: summary.goals.calories,
      unit: "kcal",
      color: "bg-amber-500",
      textColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Protein",
      total: summary.totals.protein,
      goal: summary.goals.protein,
      unit: "g",
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Carbs",
      total: summary.totals.carbs,
      goal: summary.goals.carbs,
      unit: "g",
      color: "bg-orange-400",
      textColor: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
    {
      label: "Fats",
      total: summary.totals.fat,
      goal: summary.goals.fat,
      unit: "g",
      color: "bg-rose-500",
      textColor: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-white">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-2xl font-bold tracking-tight uppercase font-heading">Nutrition Logging</h1>
          <p className="text-xs text-neutral-400 uppercase tracking-wide font-semibold mt-1">Track calories & macronutrients</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-900/60 px-4 py-3.5 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {macros.map((m) => {
          const pct = Math.min(Math.round((m.total / (m.goal || 1)) * 100), 100);
          return (
            <div
              key={m.label}
              className="card rounded-2xl p-5 border border-neutral-900 bg-neutral-950/30 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-450">
                  {m.label}
                </span>
                <p className={`text-xl font-extrabold font-heading tabular-nums mt-1 ${m.textColor}`}>
                  {toRounded(m.total)}
                  <span className="text-xs font-normal text-neutral-400 ml-0.5">{m.unit}</span>
                </p>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-semibold mb-1">
                  <span>GOAL: {m.goal}{m.unit}</span>
                  <span>{pct}%</span>
                </div>
                <div className="progress-track bg-neutral-900 h-1.5 border border-neutral-850">
                  <div className={`progress-fill ${m.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Food Form */}
      <div
        id="log-food-card"
        className="card rounded-2xl p-6 border border-neutral-900 bg-neutral-950/30 space-y-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="section-title font-heading uppercase text-sm tracking-widest text-neutral-400">Log Meals</h2>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 bg-neutral-900 border-neutral-800 text-xs py-2 h-9 rounded-xl focus:border-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={() => void startCamera()}
              className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold"
              title="Scan Food with Camera"
            >
              <Camera className="h-4 w-4" /> Scan Food
            </button>
          </div>

          {(searchLoading || searchQuery.trim()) && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-neutral-900 bg-neutral-950 shadow-2xl">
              {searchLoading && (
                <div className="flex items-center gap-2 p-4 text-xs text-neutral-400">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-800 border-t-amber-500" />
                  Searching local directory...
                </div>
              )}
              {!searchLoading && searchError && (
                <div className="p-4 text-xs text-red-400">{searchError}</div>
              )}
              {!searchLoading && !searchError && searchResults.length === 0 && searchQuery.trim() && (
                <div className="p-4 text-xs text-neutral-500">No results found</div>
              )}
              {!searchLoading &&
                !searchError &&
                searchResults.map((food) => (
                  <button
                    key={`${food.name}-${food.servingSize}`}
                    type="button"
                    onClick={() => selectFood(food)}
                    className="w-full border-b border-neutral-900 px-4 py-3 text-left last:border-0 hover:bg-neutral-900/50"
                  >
                    <div className="text-sm font-semibold text-white">{food.name}</div>
                    <div className="mt-1 flex gap-3 text-[10px] font-semibold text-neutral-400">
                      <span className="text-amber-500">{food.calories} kcal</span>
                      <span className="text-emerald-500">P: {food.protein}g</span>
                      <span className="text-orange-400">C: {food.carbs}g</span>
                      <span className="text-rose-500">F: {food.fat}g</span>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Food Name *</label>
              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                required
                className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500"
                placeholder="e.g. Chicken Breast"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Date</label>
              <input
                type="date"
                value={loggedDate}
                onChange={(e) => setLoggedDate(e.target.value)}
                required
                className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Calories *</label>
              <input
                type="number"
                min="1"
                value={calories}
                onChange={(e) =>
                  setCalories(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
                className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500"
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Protein (g)</label>
              <input
                type="number"
                min="0"
                value={protein}
                onChange={(e) =>
                  setProtein(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500"
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Carbs (g)</label>
              <input
                type="number"
                min="0"
                value={carbs}
                onChange={(e) =>
                  setCarbs(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500"
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Fats (g)</label>
              <input
                type="number"
                min="0"
                value={fats}
                onChange={(e) => setFats(e.target.value === "" ? "" : Number(e.target.value))}
                className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500"
                placeholder="0"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center gap-1.5 px-6 py-2.5 shadow-md shadow-amber-500/10 text-xs font-bold"
          >
            <Plus className="h-4 w-4" /> {submitting ? "Saving..." : "Log Food"}
          </button>
        </form>
      </div>

      {/* Food Log — grouped by meal */}
      <div className="space-y-4">
        <h2 className="section-title font-heading uppercase text-sm tracking-widest text-neutral-400">Today&apos;s Food Log</h2>

        {loading ? (
          <div className="p-6 text-center text-xs text-neutral-500">Loading food diary...</div>
        ) : logs.length === 0 ? (
          <div className="card rounded-2xl border border-neutral-900 bg-neutral-950/30 p-8 text-center flex flex-col items-center">
            <Salad className="h-10 w-10 text-neutral-500 mb-3 animate-pulse" />
            <p className="font-semibold text-neutral-300">No food logged yet today.</p>
            <a
              href="#log-food-card"
              className="btn-primary mt-4 text-xs font-semibold px-4 py-2"
            >
              Log your first meal
            </a>
          </div>
        ) : (
          MEAL_ORDER.map((group) => {
            const items = grouped[group];
            if (items.length === 0) return null;
            const groupCals = items.reduce((s, l) => s + l.calories, 0);
            const isOpen = openGroups[group];
            return (
              <div
                key={group}
                className="overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950/30 shadow-md transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }))}
                  className="flex w-full items-center justify-between px-5 py-4 text-left border-b border-neutral-900/50 hover:bg-neutral-900/10"
                >
                  <span className="text-sm font-bold font-heading uppercase tracking-wider text-white">
                    {group}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-neutral-400">
                      {groupCals} kcal
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-neutral-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="divide-y divide-neutral-900 bg-neutral-950/10">
                    {items.map((log) => (
                      <div key={log.id} className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="text-sm font-bold text-white">{log.food_name}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-semibold text-amber-500">
                              {log.calories} kcal
                            </span>
                            {log.protein_g != null && (
                              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                                P: {log.protein_g}g
                              </span>
                            )}
                            {log.carbs_g != null && (
                              <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[9px] font-semibold text-orange-400">
                                C: {log.carbs_g}g
                              </span>
                            )}
                            {log.fat_g != null && (
                              <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[9px] font-semibold text-rose-400">
                                F: {log.fat_g}g
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDelete(log.id)}
                          className="ml-4 p-1 text-neutral-500 hover:text-red-400 transition-colors"
                          aria-label={`Delete ${log.food_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Food Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes scanSweep {
                  0% { top: 0%; }
                  50% { top: 100%; }
                  100% { top: 0%; }
                }
                .scanner-line {
                  position: absolute;
                  left: 0;
                  right: 0;
                  height: 3px;
                  background: #FFB800;
                  box-shadow: 0 0 8px #FFB800;
                  animation: scanSweep 2s infinite linear;
                }
              `,
            }}
          />

          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-neutral-800 bg-[#161616] shadow-2xl">
            <div className="border-b border-neutral-800 p-4 flex justify-between items-center">
              <h3 className="font-heading font-bold text-lg text-white">AI FOOD SCANNER</h3>
              <button onClick={stopCamera} className="text-neutral-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Preview area */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 flex items-center justify-center">
                {uploadedImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={uploadedImage}
                    alt="Food to analyze"
                    className="h-full w-full object-cover"
                  />
                ) : cameraStream ? (
                  <video
                    ref={videoRef}
                    id="scanner-video"
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <Camera className="h-10 w-10 text-neutral-500 mx-auto" />
                    <p className="text-xs text-neutral-400">No image selected</p>
                    <p className="text-[10px] text-neutral-500 font-semibold uppercase">
                      Use webcam or upload a photo
                    </p>
                  </div>
                )}

                {scanLoading && (
                  <div className="scanner-line" />
                )}
              </div>

              {/* Upload & webcam toggle row */}
              {!scanResult && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 py-2 text-xs font-semibold text-neutral-300 hover:border-amber-500/50 hover:text-white transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadedImage ? "Change Image" : "Upload Image"}
                  </button>
                  {!cameraStream && !uploadedImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setScanResult(null);
                        setUploadedImage(null);
                        setTimeout(async () => {
                           try {
                             const stream = await navigator.mediaDevices.getUserMedia({
                               video: { facingMode: "environment" },
                             });
                             setCameraStream(stream);
                           } catch {
                             showToast("Camera access denied", "error");
                           }
                        }, 50);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 py-2 text-xs font-semibold text-neutral-300 hover:border-amber-500/50 hover:text-white transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" /> Use Webcam
                    </button>
                  )}
                </div>
              )}

              {scanLoading && (
                <p className="text-center text-xs text-[#FFB800] font-semibold animate-pulse">
                  Analyzing image with AI vision model...
                </p>
              )}

              {scanResult ? (
                <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#FFB800]">
                      Detected Food
                    </p>
                    <h4 className="text-base font-bold text-white mt-0.5">{scanResult.name}</h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{scanResult.servingSize}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="block font-extrabold text-white">
                        {scanResult.calories}
                      </span>
                      <span className="text-[9px] text-neutral-500 font-bold uppercase">kcal</span>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="block font-extrabold text-emerald-400">
                        {scanResult.protein}g
                      </span>
                      <span className="text-[9px] text-neutral-500 font-bold uppercase">Prot</span>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="block font-extrabold text-amber-400">
                        {scanResult.carbs}g
                      </span>
                      <span className="text-[9px] text-neutral-500 font-bold uppercase">Carb</span>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="block font-extrabold text-rose-400">
                        {scanResult.fat}g
                      </span>
                      <span className="text-[9px] text-neutral-500 font-bold uppercase">Fat</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setScanResult(null); }}
                      className="btn-secondary flex-1 text-xs py-2 bg-neutral-800 border border-neutral-700 flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Rescan
                    </button>
                    <button
                      onClick={acceptScan}
                      className="btn-primary flex-1 text-xs py-2 text-black bg-[#FFB800] flex items-center justify-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => void handleScanImage()}
                  disabled={scanLoading || (!uploadedImage && !cameraStream)}
                  className="btn-primary w-full py-2.5 text-black bg-[#FFB800] flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {scanLoading ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Analyzing...</>
                  ) : uploadedImage ? (
                    <><Upload className="h-4 w-4" /> Analyze Uploaded Image</>
                  ) : cameraStream ? (
                    <><Camera className="h-4 w-4" /> Capture &amp; Analyze</>
                  ) : (
                    "Select an image above to analyze"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
