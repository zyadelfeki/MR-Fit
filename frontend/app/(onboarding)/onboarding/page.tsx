"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

interface OnboardingForms {
    // Step 1
    display_name: string;
    date_of_birth: string;
    gender: string;
    // Step 2
    height_cm: number | "";
    weight_kg: number | "";
    // Step 3
    fitness_goal: string;
    // Step 4
    fitness_level: string;
}

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<OnboardingForms>({
        display_name: "",
        date_of_birth: "",
        gender: "male", // default
        height_cm: "",
        weight_kg: "",
        fitness_goal: "lose_weight", // default
        fitness_level: "beginner", // default
    });

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

    const prevStep = () => {
        setError("");
        setStep((prev) => prev - 1);
    };

    const submitForm = async () => {
        setLoading(true);
        setError("");

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("User not authenticated.");

            const { error: insertError } = await supabase
                .from("profiles")
                .insert({
                    user_id: user.id,
                    display_name: formData.display_name,
                    date_of_birth: formData.date_of_birth,
                    gender: formData.gender,
                    height_cm: Number(formData.height_cm),
                    weight_kg: Number(formData.weight_kg),
                    fitness_goal: formData.fitness_goal,
                    fitness_level: formData.fitness_level,
                });

            if (insertError) throw insertError;

            // Force a hard navigation to ensure middleware correctly picks up the new profile state
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError(err.message || "An error occurred while saving your profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div>
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                    <span>Step {step} of 4</span>
                    <span>{Math.round((step / 4) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(step / 4) * 100}%` }}
                    ></div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Complete your profile</h2>

            {error && <div className="text-red-500 text-sm mb-4 font-medium bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}

            <div className="space-y-4">
                {step === 1 && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Display Name</label>
                            <input
                                type="text"
                                name="display_name"
                                value={formData.display_name}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            >
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                            <input
                                type="number"
                                name="height_cm"
                                min="50"
                                max="300"
                                value={formData.height_cm}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                            <input
                                type="number"
                                name="weight_kg"
                                min="20"
                                max="500"
                                value={formData.weight_kg}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fitness Goal</label>
                            <select
                                name="fitness_goal"
                                value={formData.fitness_goal}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="lose_weight">Lose Weight</option>
                                <option value="build_muscle">Build Muscle</option>
                                <option value="improve_endurance">Improve Endurance</option>
                                <option value="maintain">Maintain</option>
                                <option value="flexibility">Flexibility</option>
                            </select>
                        </div>
                    </>
                )}

                {step === 4 && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fitness Level</label>
                            <select
                                name="fitness_level"
                                value={formData.fitness_level}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </>
                )}

                <div className="flex justify-between pt-6">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="bg-gray-100 text-gray-800 py-2 px-5 rounded-md hover:bg-gray-200 transition font-medium"
                            disabled={loading}
                        >
                            Back
                        </button>
                    ) : (
                        <div></div> /* Placeholder to keep 'Next' button on the right */
                    )}
                    {step < 4 ? (
                        <button
                            onClick={nextStep}
                            className="bg-blue-600 text-white py-2 px-5 rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={submitForm}
                            className="bg-blue-600 text-white py-2 px-5 rounded-md hover:bg-blue-700 transition font-medium flex items-center justify-center shadow-sm"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Finish"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
