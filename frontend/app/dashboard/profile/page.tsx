"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { showToast } from "@/lib/toast";

type Profile = {
    display_name: string | null;
    date_of_birth: string | null;
    gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
    height_cm: number | null;
    weight_kg: number | null;
    fitness_goal:
    | "lose_weight"
    | "build_muscle"
    | "improve_endurance"
    | "maintain"
    | "flexibility"
    | null;
    fitness_level: "beginner" | "intermediate" | "advanced" | null;
};

export const metadata = { title: "Profile | MR-Fit" };

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
                        date_of_birth: data.profile.date_of_birth
                            ? data.profile.date_of_birth.split("T")[0]
                            : "",
                        gender: data.profile.gender || null,
                        height_cm: data.profile.height_cm || null,
                        weight_kg: data.profile.weight_kg || null,
                        fitness_goal: data.profile.fitness_goal || null,
                        fitness_level: data.profile.fitness_level || null,
                    });
                }
            } catch (err: any) {
                setError(err.message || "Something went wrong fetching your profile.");
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setError(null);
        setSuccess(null);
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

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

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update profile");
            }

            setSuccess("Profile updated!");
            showToast("✅ Profile updated", "success");
        } catch (err: any) {
            setError(err.message || "Failed to update profile.");
            showToast("❌ Something went wrong. Please try again.", "error");
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

            // Sign out after account deletion
            await signOut({ callbackUrl: "/login" });
        } catch (err: any) {
            setError(err.message);
            showToast("❌ Something went wrong. Please try again.", "error");
        } finally {
            setSaving(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <p className="text-gray-500">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Profile Settings
            </h1>

            {success && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                    {success}
                </div>
            )}

            {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Display Name
                        </label>
                        <input
                            type="text"
                            name="display_name"
                            value={profile.display_name || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            name="date_of_birth"
                            value={profile.date_of_birth || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Gender
                        </label>
                        <select
                            name="gender"
                            value={profile.gender || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer Not To Say</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Height (cm)
                        </label>
                        <input
                            type="number"
                            name="height_cm"
                            value={profile.height_cm || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            placeholder="175"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Weight (kg)
                        </label>
                        <input
                            type="number"
                            name="weight_kg"
                            value={profile.weight_kg || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            placeholder="70"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fitness Goal
                        </label>
                        <select
                            name="fitness_goal"
                            value={profile.fitness_goal || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                        >
                            <option value="">Select Goal</option>
                            <option value="lose_weight">Lose Weight</option>
                            <option value="build_muscle">Build Muscle</option>
                            <option value="improve_endurance">Improve Endurance</option>
                            <option value="maintain">Maintain</option>
                            <option value="flexibility">Flexibility</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fitness Level
                        </label>
                        <select
                            name="fitness_level"
                            value={profile.fitness_level || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                        >
                            <option value="">Select Level</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Profile"}
                    </button>
                </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-10 bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-red-200 dark:border-red-900">
                <h3 className="text-lg leading-6 font-medium text-red-600 dark:text-red-500">
                    Danger Zone
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                    <p>Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <div className="mt-5">
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div
                    className="fixed z-10 inset-0 overflow-y-auto"
                    aria-labelledby="modal-title"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            aria-hidden="true"
                            onClick={() => setShowDeleteModal(false)}
                        />
                        <span
                            className="hidden sm:inline-block sm:align-middle sm:h-screen"
                            aria-hidden="true"
                        >
                            &#8203;
                        </span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg
                                            className="h-6 w-6 text-red-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3
                                            className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                                            id="modal-title"
                                        >
                                            Delete Account
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Are you sure? This cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Confirm Delete
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
