import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppStore, useAppDispatch } from "./use-redux";
import { useNotification } from "./use-notification";
import { usePathname } from "next/navigation";
import { setAuth, clearAuth } from "@/redux/slices/authSlice";

export const useAuthObserver = () => {
    // console.log("useAuthObserver");
    const store = useAppStore();
    const dispatch = useAppDispatch();
    const { open } = useNotification();
    const pathname = usePathname();
    const [initialized, setInitialized] = useState(false);
    const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

    useEffect(() => {
        const unsuscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // console.log("User logged in:", user.uid);
                setFirebaseUid(user.uid);
                // Sync Firebase Auth with Redux Auth
                const state = store.getState();
                const currentUid = state.auth.firebaseUid;

                if (currentUid !== user.uid) {
                    dispatch(setAuth(user.uid));
                }
            } else {
                // L'utilisateur est déconnecté, on nettoie
                // console.log("User logged out, clearing state.");
                setFirebaseUid(null);
                dispatch(clearAuth());
            }
            setInitialized(true);
        })
        return () => {
            unsuscribe();
        }
    }, [dispatch, store, open, pathname])

    return { initialized, firebaseUid };
}
