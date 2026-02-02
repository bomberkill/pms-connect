import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppStore, useAppDispatch } from "./use-redux";
import { useNotification } from "./use-notification";
import { usePathname } from "next/navigation";
import { setAuth, clearAuth } from "@/redux/slices/authSlice";

export const useAuthObserver = () => {
    const store = useAppStore();
    const dispatch = useAppDispatch();
    const { open } = useNotification();
    const pathname = usePathname();
    const [initialized, setInitialized] = useState(false);
    const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setFirebaseUid(user.uid);
                // Sync Firebase Auth with Redux Auth
                const state = store.getState();
                const currentUid = state.auth.firebaseUid;

                if (currentUid !== user.uid) {
                    dispatch(setAuth(user.uid));
                }
            } else {
                // User is logged out, clear state
                setFirebaseUid(null);
                dispatch(clearAuth());
            }
            setInitialized(true);
        })
        return () => {
            unsubscribe();
        }
    }, [dispatch, store, open, pathname])

    return { initialized, firebaseUid };
}
