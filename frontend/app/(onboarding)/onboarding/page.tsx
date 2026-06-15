"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Ruler,
  Target,
  Flame,
  Dumbbell,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Sprout,
  Scale,
  Compass,
  Check,
  AlertCircle,
  Zap,
} from "lucide-react";

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
  { title: "About You", icon: <User className="h-10 w-10 text-amber-500" />, subtitle: "Tell us a bit about yourself" },
  { title: "Body Stats", icon: <Ruler className="h-10 w-10 text-amber-500" />, subtitle: "We use this to calculate your needs" },
  { title: "Your Goal", icon: <Target className="h-10 w-10 text-amber-500" />, subtitle: "What are you working towards?" },
  { title: "Fitness Level", icon: <Dumbbell className="h-10 w-10 text-amber-500" />, subtitle: "How experienced are you?" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

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
    setDirection("next");
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError("");
    setDirection("prev");
    setStep((prev) => prev - 1);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-950 to-amber-950/10 flex items-center justify-center px-4 py-12 text-white">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-sm text-neutral-400 mb-2">
            <span className="font-medium">Step {step} of {STEPS.length}</span>
            <span className="font-semibold text-amber-500">{progress}%</span>
          </div>
          <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i + 1 < step ? "bg-amber-500" :
                  i + 1 === step ? "bg-amber-500 ring-4 ring-amber-500/20" :
                  "bg-neutral-800 border border-neutral-700"
                }`} />
                <span className={`text-[10px] hidden sm:block uppercase tracking-wider mt-1 ${
                  i + 1 === step ? "text-amber-500 font-semibold" : "text-neutral-500"
                }`}>{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-neutral-950/80 backdrop-blur border border-neutral-900 rounded-3xl shadow-2xl p-8 transition-all duration-300">
          {/* Step header */}
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl mb-4 border border-amber-500/20">
              {currentStep.icon}
            </div>
            <h2 className="text-2xl font-bold font-heading text-white tracking-wide">{currentStep.title.toUpperCase()}</h2>
            <p className="text-sm text-neutral-400 mt-1.5">{currentStep.subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-900/60 px-4 py-3.5 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Step 1 Form */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Display Name</label>
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500 transition-colors" placeholder="e.g. Alex" required />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Date of Birth</label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500 transition-colors" required />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500 transition-colors">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2 Form */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Height (cm)</label>
                  <input type="number" name="height_cm" min="50" max="300" value={formData.height_cm} onChange={handleChange} className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500 transition-colors" placeholder="e.g. 175" required />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">Weight (kg)</label>
                  <input type="number" name="weight_kg" min="20" max="500" value={formData.weight_kg} onChange={handleChange} className="input-field bg-neutral-900 border-neutral-800 text-white rounded-xl focus:border-amber-500 transition-colors" placeholder="e.g. 70" required />
                </div>
              </div>
            )}

            {/* Step 3 Goal Selection */}
            {step === 3 && (
              <div className="space-y-3 animate-fade-in">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">What&apos;s your primary goal?</label>
                {[
                  { value: "lose_weight", label: "Lose Weight", icon: <Flame className="h-5 w-5 text-amber-500" /> },
                  { value: "build_muscle", label: "Build Muscle", icon: <Dumbbell className="h-5 w-5 text-amber-500" /> },
                  { value: "improve_endurance", label: "Improve Endurance", icon: <Zap className="h-5 w-5 text-amber-500" /> },
                  { value: "maintain", label: "Maintain", icon: <Scale className="h-5 w-5 text-amber-500" /> },
                  { value: "flexibility", label: "Flexibility & Mobility", icon: <Compass className="h-5 w-5 text-amber-500" /> },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.fitness_goal === opt.value
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-neutral-900 bg-neutral-900/50 hover:border-neutral-800"
                  }`}>
                    <input type="radio" name="fitness_goal" value={opt.value} checked={formData.fitness_goal === opt.value} onChange={handleChange} className="sr-only" />
                    <span className="p-2 bg-neutral-950/60 rounded-xl">{opt.icon}</span>
                    <span className={`text-sm font-semibold ${
                      formData.fitness_goal === opt.value ? "text-white" : "text-neutral-300"
                    }`}>{opt.label}</span>
                    {formData.fitness_goal === opt.value && (
                      <Check className="ml-auto h-5 w-5 text-amber-500" />
                    )}
                  </label>
                ))}
              </div>
            )}

            {/* Step 4 Experience Selection */}
            {step === 4 && (
              <div className="space-y-3 animate-fade-in">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">How would you describe your fitness level?</label>
                {[
                  { value: "beginner", label: "Beginner", icon: <Sprout className="h-5 w-5 text-amber-500" />, desc: "New to regular structured exercise" },
                  { value: "intermediate", label: "Intermediate", icon: <Dumbbell className="h-5 w-5 text-amber-500" />, desc: "Training consistently for 6+ months" },
                  { value: "advanced", label: "Advanced", icon: <Trophy className="h-5 w-5 text-amber-500" />, desc: "Serious athlete or 2+ years experience" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.fitness_level === opt.value
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-neutral-900 bg-neutral-900/50 hover:border-neutral-800"
                  }`}>
                    <input type="radio" name="fitness_level" value={opt.value} checked={formData.fitness_level === opt.value} onChange={handleChange} className="sr-only" />
                    <span className="p-2 bg-neutral-950/60 rounded-xl">{opt.icon}</span>
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold ${
                        formData.fitness_level === opt.value ? "text-white" : "text-neutral-300"
                      }`}>{opt.label}</span>
                      <span className="text-xs text-neutral-400 mt-0.5">{opt.desc}</span>
                    </div>
                    {formData.fitness_level === opt.value && (
                      <Check className="ml-auto h-5 w-5 text-amber-500" />
                    )}
                  </label>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-between pt-6 border-t border-neutral-900 mt-6">
              {step > 1 ? (
                <button onClick={prevStep} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 text-sm font-semibold text-neutral-300 hover:bg-neutral-800 transition-all">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : <div />}

              {step < 4 ? (
                <button onClick={nextStep}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-amber-500/10">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={submitForm} disabled={loading}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-amber-500/10">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-neutral-950" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <Check className="h-4 w-4" />
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
