export type ToastType = "success" | "error" | "info";

export type ToastPayload = {
    id: string;
    message: string;
    type: ToastType;
};

const TOAST_EVENT = "mrfit:toast";

export function showToast(message: string, type: ToastType = "info") {
    if (typeof window === "undefined") {
        return;
    }

    const payload: ToastPayload = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message,
        type,
    };

    window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
}

export function getToastEventName() {
    return TOAST_EVENT;
}
