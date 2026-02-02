import { toast } from "sonner";

export type NotificationOptions = {
    message?: string;
    duration?: number;
};

export const notify = (
    type: "success" | "error" | "info",
    title: string,
    options?: NotificationOptions
) => {
    const toastOptions = {
        description: options?.message,
        duration: options?.duration ?? 5000,
    };

    if (type === "success") {
        toast.success(title, toastOptions);
    } else if (type === "error") {
        toast.error(title, toastOptions);
    } else {
        toast.info(title, toastOptions);
    }
};
