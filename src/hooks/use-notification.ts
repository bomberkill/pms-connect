import { notify, NotificationOptions } from "@/utils/notification";

export function useNotification() {
    return {
        open: (type: "success" | "error" | "info", title: string, options?: NotificationOptions) => notify(type, title, options),
    }
}
