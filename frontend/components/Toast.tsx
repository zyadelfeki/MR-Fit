"use client";

import { useEffect, useMemo, useState } from "react";
import { getToastEventName, type ToastPayload, type ToastType } from "@/lib/toast";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";

type ToastItem = ToastPayload & {
    closing: boolean;
};

function typeClasses(type: ToastType): string {
    if (type === "success") {
        return "border-emerald-500/20 bg-neutral-900 text-emerald-450";
    }

    if (type === "error") {
        return "border-red-900/30 bg-neutral-900 text-red-400";
    }

    return "border-neutral-800 bg-[#161616] text-[#FFB800]";
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
                    className={`rounded-2xl border px-4 py-3.5 shadow-2xl transition-all duration-300 ${typeClasses(toast.type)} ${toast.closing ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {toast.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-505" />}
                            {toast.type === "error" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            {toast.type !== "success" && toast.type !== "error" && <Info className="h-4 w-4 text-[#FFB800]" />}
                            <p className="text-xs font-semibold text-white">{toast.message}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
                            className="text-neutral-450 hover:text-white transition-colors p-0.5"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
