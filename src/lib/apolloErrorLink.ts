import { onError } from "@apollo/client/link/error";
import { notify } from "@/utils/notification";
import frDict from "@/dictionaries/fr.json";
import enDict from "@/dictionaries/en.json";

// Helper to get dictionary based on current URL (Client-side only)
const getDict = () => {
    if (typeof window === "undefined") return frDict; // Fallback for server-side (though link usually runs on client)
    const pathname = window.location.pathname;
    if (pathname.startsWith("/en")) return enDict;
    return frDict; // Default to French
};

export const errorLink = onError(({ graphQLErrors, networkError }) => {
    const dict = getDict();

    if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path, extensions }) => {
            console.error(
                `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
            );

            // Handle generic UNAUTHENTICATED error
            if (extensions?.code === 'UNAUTHENTICATED') {
                handleAuthError();
                return;
            }

            // Handle specific Firebase token expiration
            // The error message usually contains "auth/id-token-expired"
            const errorMessage = message.toLowerCase();
            if (errorMessage.includes('auth/id-token-expired') ||
                (extensions?.exception as Record<string, unknown>)?.codePrefix === 'auth') {

                console.log('🔄 Token expired, attempting handling...');

                if (typeof window !== 'undefined') {
                    // Try to refresh token if possible (client-side)
                    // For now, simpliest approach is to force logout/login to get fresh token
                    // In a more advanced setup we would try `getIdToken(true)` and retry request
                    handleAuthError();
                }
                return;
            }

            // Display toast for other GraphQL errors (Validation, Internal Error, etc.)
            notify("error", dict.globalErrors.default, {
                message: message || dict.globalErrors.defaultDescription,
                duration: 5000,
            });
        });
    }

    if (networkError) {
        console.error(`[Network error]: ${networkError}`);
        // Avoid spamming "Network Error" when the app was just in the background (common on mobile wake-up)
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
            notify("error", dict.globalErrors.network, {
                message: dict.globalErrors.networkDescription,
                duration: 5000,
            });
        }
    }
});

function handleAuthError() {
    if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const locale = pathname.startsWith('/en') ? 'en' : 'fr';

        // Clear potential stale data
        // localStorage.removeItem('token'); // if used

        // Redirect to login
        window.location.href = `/${locale}/login?expired=true`;
    }
}
