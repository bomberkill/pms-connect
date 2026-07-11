import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useAppStore, useAppDispatch } from "./use-redux";
import { setAuth, clearAuth } from "@/redux/slices/authSlice";

export const useAuthObserver = () => {
    const store = useAppStore();
    const dispatch = useAppDispatch();
    const { data: session, isPending } = useSession();

    useEffect(() => {
        if (isPending) return;
        const userId = session?.user?.id ?? null;
        const currentAuthUserId = store.getState().auth.authUserId;

        if (userId) {
            if (currentAuthUserId !== userId) {
                dispatch(setAuth(userId));
            }
        } else if (currentAuthUserId !== null) {
            dispatch(clearAuth());
        }
    }, [session, isPending, dispatch, store]);

    return { initialized: !isPending, authUserId: session?.user?.id ?? null };
}
