"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { showToast } from "@/lib/toast";
import {
  Ruler,
  Scale,
  Target,
  Dumbbell,
  Save,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

type Profile = {
  display_name: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_goal: "lose_weight" | "build_muscle" | "improve_endurance" | "maintain" | "flexibility" | null;
  fitness_level: "beginner" | "intermediate" | "advanced" | null;
};

const goalLabels: Record<string, string> = {
  lose_weight: "Lose Weight",
  build_muscle: "Build Muscle",
  improve_endurance: "Improve Endurance",
  maintain: "Maintain",
  flexibility: "Flexibility",
};

const levelLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    display_name: "",
    date_of_birth: "",
    gender: null,
    height_cm: null,
    weight_kg: null,
    fitness_goal: null,
    fitness_level: null,
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (data.profile) {
          setProfile({
            display_name: data.profile.display_name || "",
            date_of_birth: data.profile.date_of_birth ? data.profile.date_of_birth.split("T")[0] : "",
            gender: data.profile.gender || null,
            height_cm: data.profile.height_cm || null,
            weight_kg: data.profile.weight_kg || null,
            fitness_goal: data.profile.fitness_goal || null,
            fitness_level: data.profile.fitness_level || null,
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong fetching your profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setError(null); setSuccess(null);
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: profile.display_name || null,
          date_of_birth: profile.date_of_birth || null,
          gender: profile.gender || null,
          height_cm: profile.height_cm ? Number(profile.height_cm) : null,
          weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
          fitness_goal: profile.fitness_goal || null,
          fitness_level: profile.fitness_level || null,
        }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed to update profile"); }
      setSuccess("Profile updated!");
      showToast("Profile updated", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      setError(msg);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/delete-account", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await signOut({ callbackUrl: "/login" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSaving(false); setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const initials = profile.display_name
    ? profile.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Avatar block */}
      <div className="bg-[#161616] rounded-2xl shadow-sm border border-neutral-800 p-6">
        <div className="flex items-center gap-5">
          <div className="flex-shrink-0 w-20 h-20 rounded-full bg-[#FFB800] text-black flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {profile.display_name || "Your Name"}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.height_cm && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300">
                  <Ruler className="h-3.5 w-3.5 text-neutral-400" /> {profile.height_cm} cm
                </span>
              )}
              {profile.weight_kg && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300">
                  <Scale className="h-3.5 w-3.5 text-neutral-400" /> {profile.weight_kg} kg
                </span>
              )}
              {profile.fitness_goal && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-xs font-medium text-[#FFB800]">
                  <Target className="h-3.5 w-3.5" /> {goalLabels[profile.fitness_goal] ?? profile.fitness_goal}
                </span>
              )}
              {profile.fitness_level && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                  <Dumbbell className="h-3.5 w-3.5" /> {levelLabels[profile.fitness_level] ?? profile.fitness_level}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="16" r="1" fill="currentColor" /></svg>
          {error}
        </div>
      )}

      <RevealOnScroll className="space-y-6">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-5">
          <h2 className="section-title text-gray-900 dark:text-white font-bold">Edit Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
              <input type="text" name="display_name" value={profile.display_name || ""} onChange={handleChange} className="input-field" placeholder="Your Name" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
              <input type="date" name="date_of_birth" value={profile.date_of_birth || ""} onChange={handleChange} className="input-field" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
              <select name="gender" value={profile.gender || ""} onChange={handleChange} className="input-field">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer Not To Say</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
              <input type="number" name="height_cm" value={profile.height_cm || ""} onChange={handleChange} className="input-field" placeholder="175" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
              <input type="number" name="weight_kg" value={profile.weight_kg || ""} onChange={handleChange} className="input-field" placeholder="70" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fitness Goal</label>
              <select name="fitness_goal" value={profile.fitness_goal || ""} onChange={handleChange} className="input-field">
                <option value="">Select Goal</option>
                <option value="lose_weight">Lose Weight</option>
                <option value="build_muscle">Build Muscle</option>
                <option value="improve_endurance">Improve Endurance</option>
                <option value="maintain">Maintain</option>
                <option value="flexibility">Flexibility</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fitness Level</label>
              <select name="fitness_level" value={profile.fitness_level || ""} onChange={handleChange} className="input-field">
                <option value="">Select Level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary bg-[#FFB800] text-black px-6 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] transition-all">
              {saving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 text-black" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </RevealOnScroll>

      <div className="bg-[#161616] rounded-2xl shadow-sm border border-red-900/30 p-6">
        <h3 className="text-base font-semibold text-red-500 mb-1">Danger Zone</h3>
        <p className="text-sm text-neutral-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <button type="button" onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-900/50 text-sm font-medium text-red-400 hover:bg-red-950/20 transition-colors">
          <Trash2 className="h-4 w-4" />
          Delete Account
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative z-10 w-full max-w-sm bg-neutral-900 rounded-2xl shadow-2xl p-6 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-950/40 flex items-center justify-center flex-shrink-0 border border-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 id="modal-title" className="font-semibold text-white">Delete Account</h3>
                <p className="text-xs text-neutral-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">All your data — workouts, nutrition logs, progress — will be permanently deleted.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={saving}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
