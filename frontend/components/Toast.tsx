"use client";

import { useEffect, useMemo, useState } from "react";
import { getToastEventName, type ToastPayload, type ToastType } from "@/lib/toast";

type ToastItem = ToastPayload & {
    closing: boolean;
};

function typeClasses(type: ToastType): string {
    if (type === "success") {
        return "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-200";
    }

    if (type === "error") {
        return "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200";
    }

    return "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-200";
}

export default function Toast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        const eventName = getToastEventName();

        const handler = (event: Event) => {
            const customEvent = event as CustomEvent<ToastPayload>;
            const payload = customEvent.detail;

            if (!payload) {
                return;
            }

            setToasts((prev) => {
                const next = [{ ...payload, closing: false }, ...prev].slice(0, 3);
                return next;
            });
        };

        window.addEventListener(eventName, handler as EventListener);
        return () => {
            window.removeEventListener(eventName, handler as EventListener);
        };
    }, []);

    useEffect(() => {
        const timers = toasts.map((toast) => {
            const closeTimer = setTimeout(() => {
                setToasts((prev) =>
                    prev.map((item) => (item.id === toast.id ? { ...item, closing: true } : item))
                );
            }, 2500);

            const removeTimer = setTimeout(() => {
                setToasts((prev) => prev.filter((item) => item.id !== toast.id));
            }, 3000);

            return { closeTimer, removeTimer };
        });

        return () => {
            timers.forEach((timer) => {
                clearTimeout(timer.closeTimer);
                clearTimeout(timer.removeTimer);
            });
        };
    }, [toasts]);

    const rendered = useMemo(() => toasts, [toasts]);

    if (rendered.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,24rem)] flex-col gap-2">
            {rendered.map((toast) => (
                <div
                    key={toast.id}
                    className={`rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 ${typeClasses(toast.type)} ${toast.closing ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
                            className="text-xs opacity-70 transition hover:opacity-100"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
