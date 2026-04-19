"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">Something went wrong!</h1>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">We apologize for the inconvenience. An unexpected error has occurred.</p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <button
                        onClick={() => reset()}
                        className="btn-brand"
                    >
                        Try again
                    </button>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
