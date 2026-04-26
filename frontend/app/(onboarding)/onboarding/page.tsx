"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface OnboardingForms {
  display_name: string;
  date_of_birth: string;
  gender: string;
  height_cm: number | "";
  weight_kg: number | "";
  fitness_goal: string;
  fitness_level: string;
}

const STEPS = [
  { title: "About You", emoji: "👤", subtitle: "Tell us a bit about yourself" },
  { title: "Body Stats", emoji: "📏", subtitle: "We use this to calculate your needs" },
  { title: "Your Goal", emoji: "🎯", subtitle: "What are you working towards?" },
  { title: "Fitness Level", emoji: "💪", subtitle: "How experienced are you?" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<OnboardingForms>({
    display_name: "",
    date_of_birth: "",
    gender: "male",
    height_cm: "",
    weight_kg: "",
    fitness_goal: "lose_weight",
    fitness_level: "beginner",
  });

  const currentStep = STEPS[step - 1];
  const progress = Math.round((step / STEPS.length) * 100);

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!formData.display_name || !formData.date_of_birth || !formData.gender) {
        setError("Please fill out all fields.");
        return;
      }
    } else if (step === 2) {
      if (!formData.height_cm || !formData.weight_kg) {
        setError("Please fill out all fields.");
        return;
      }
      if (Number(formData.height_cm) < 50 || Number(formData.height_cm) > 300) {
        setError("Height must be between 50 and 300 cm.");
        return;
      }
      if (Number(formData.weight_kg) < 20 || Number(formData.weight_kg) > 500) {
        setError("Weight must be between 20 and 500 kg.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => { setError(""); setStep((prev) => prev - 1); };

  const submitForm = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: formData.display_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          height_cm: Number(formData.height_cm),
          weight_kg: Number(formData.weight_kg),
          fitness_goal: formData.fitness_goal,
          fitness_level: formData.fitness_level,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");
      window.location.href = "/dashboard?welcome=1";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred while saving your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span className="font-medium">Step {step} of {STEPS.length}</span>
            <span className="font-medium text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-3">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i + 1 < step ? "bg-indigo-600" :
                  i + 1 === step ? "bg-indigo-600 ring-2 ring-indigo-200" :
                  "bg-gray-300 dark:bg-gray-600"
                }`} />
                <span className={`text-xs hidden sm:block ${
                  i + 1 === step ? "text-indigo-600 font-medium" : "text-gray-400"
                }`}>{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
          {/* Step header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">{currentStep.emoji}</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentStep.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{currentStep.subtitle}</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className="input-field" placeholder="e.g. Alex" required />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="input-field" required />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
                  <input type="number" name="height_cm" min="50" max="300" value={formData.height_cm} onChange={handleChange} className="input-field" placeholder="e.g. 175" required />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
                  <input type="number" name="weight_kg" min="20" max="500" value={formData.weight_kg} onChange={handleChange} className="input-field" placeholder="e.g. 70" required />
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">What&apos;s your primary goal?</label>
                {[
                  { value: "lose_weight", label: "Lose Weight", emoji: "🔥" },
                  { value: "build_muscle", label: "Build Muscle", emoji: "💪" },
                  { value: "improve_endurance", label: "Improve Endurance", emoji: "🏃" },
                  { value: "maintain", label: "Maintain", emoji: "⚖️" },
                  { value: "flexibility", label: "Flexibility", emoji: "🧘" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.fitness_goal === opt.value
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                  }`}>
                    <input type="radio" name="fitness_goal" value={opt.value} checked={formData.fitness_goal === opt.value} onChange={handleChange} className="sr-only" />
                    <span className="text-xl">{opt.emoji}</span>
                    <span className={`text-sm font-medium ${
                      formData.fitness_goal === opt.value ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"
                    }`}>{opt.label}</span>
                    {formData.fitness_goal === opt.value && (
                      <svg className="ml-auto h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">How would you describe your fitness level?</label>
                {[
                  { value: "beginner", label: "Beginner", emoji: "🌱", desc: "New to regular exercise" },
                  { value: "intermediate", label: "Intermediate", emoji: "🏋️", desc: "Training consistently for 6+ months" },
                  { value: "advanced", label: "Advanced", emoji: "🏆", desc: "Serious athlete or 2+ years experience" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.fitness_level === opt.value
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                  }`}>
                    <input type="radio" name="fitness_level" value={opt.value} checked={formData.fitness_level === opt.value} onChange={handleChange} className="sr-only" />
                    <span className="text-xl">{opt.emoji}</span>
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${
                        formData.fitness_level === opt.value ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"
                      }`}>{opt.label}</span>
                      <span className="text-xs text-gray-400">{opt.desc}</span>
                    </div>
                    {formData.fitness_level === opt.value && (
                      <svg className="ml-auto h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <button onClick={prevStep} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back
                </button>
              ) : <div />}

              {step < 4 ? (
                <button onClick={nextStep}
                  className="btn-primary px-6 py-2.5">
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <button onClick={submitForm} disabled={loading}
                  className="btn-primary px-6 py-2.5">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      Get Started 🎉
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
