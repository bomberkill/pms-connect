"use client"
import { RootState, AppDispatch, AppStore } from "@/redux/store";
import { onAuthStateChanged } from "firebase/auth";
import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { auth } from "./firebase";
import { clearAuth, setAuth } from "@/redux/slices/authSlice";
import { fetchUserByUid, logoutUser } from "@/redux/services/userService";
import { DictionaryContext } from "@/components/DictionaryProvider";
import { clearUser } from "@/redux/slices/userSlice";
import { toast } from "sonner";
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppStore = useStore.withTypes<AppStore>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const useAuthObserver = () => {
    console.log("useAuthObserver");
    const store = useAppStore();
    const dispatch = useAppDispatch();
    const { open } = useNotification();
    const dict = useDictionary();
    const [initialized, setInitialized] = useState(false);
    const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
    useEffect(() => {
        const unsuscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // console.log("User logged in:", user.uid);
                setFirebaseUid(user.uid);
                // L'utilisateur est authentifié via Firebase
                const state = store.getState();
                const existingUser = state.user.user;

                // On met à jour l'UID dans tous les cas.
                dispatch(setAuth(user.uid));

                // On ne va chercher le profil que s'il n'est pas déjà dans le store
                // ou si l'UID a changé (cas très rare, mais sécuritaire).
                // Cela évite la requête redondante lors du login.
                if (!existingUser || existingUser.firebaseUid !== user.uid) {
                    dispatch(fetchUserByUid(user.uid)).unwrap().catch((err) => {
                        console.error("Failed to fetch user profile on auth state change:", err);
                        // Si le profil est introuvable, on déconnecte pour éviter un état incohérent.
                        dispatch(logoutUser()).unwrap();
                        open("error",dict.notifications.login.error.title, { message: dict.notifications.login.error.messages.default })
                    });
                }
            } else {
                // L'utilisateur est déconnecté, on nettoie les deux slices.
                // Le ProtectedLayout se chargera de la redirection en observant ce changement d'état.
                console.log("User logged out, clearing state.");
                setFirebaseUid(null);
                dispatch(clearAuth());
                dispatch(clearUser());
            }
            setInitialized(true);
        })
        return () => {
            unsuscribe();
        }
    }, [dispatch, store])
    
    return {initialized, firebaseUid};
}

export function useDictionary() {
    const dictionary = useContext(DictionaryContext)
    if (!dictionary) {
        throw new Error("useDictionary must be used within a DictionaryProvider")
    }
    return dictionary
}

type NotificationOptions = {
    message: string,
    duration?: number,
}
export function useNotification () {

    const show = (
        type: "success" | "error" | "info",
        title: string,
        options?: NotificationOptions
    ) => {
        const toastOptions = {
            description: options?.message,
            duration: options?.duration ?? 5000,
        }
        // toast[type](title, toastOptions);
        if (type === "success") {
            toast.success(title, toastOptions)
        } else if (type === "error") {
            toast.error(title, toastOptions)
        } else {
            toast.info(title, toastOptions)
        }
    }
    return {
        open: (type: "success" | "error" | "info", title: string, options?: NotificationOptions) => show(type, title, options),
    }
}
