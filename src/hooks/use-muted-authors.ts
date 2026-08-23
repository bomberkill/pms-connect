import { useSyncExternalStore } from "react";
import { subscribeMutedAuthors, getMutedAuthorIdsSnapshot } from "@/lib/muted-authors";

/**
 * Live-reactive list of muted author ids (localStorage-backed, see
 * src/lib/muted-authors.ts). Re-renders any component using this hook
 * whenever an author gets muted, anywhere in the app.
 *
 * Deliberately reuses the same snapshot function for the "server" slot:
 * passing a distinct always-empty getServerSnapshot meant React kept
 * using that stale empty value post-hydration until some unrelated
 * re-render happened to occur, since nothing here forces one on mount —
 * confirmed as a real bug (mute worked live, but silently "forgot" itself
 * on the very next page load) before switching to this. getMutedAuthorIdsSnapshot
 * already returns an empty array in a real SSR/Node environment (no
 * window), so there's no actual server/client markup mismatch risk from
 * sharing it here — the mute list never affects server-rendered output.
 */
export function useMutedAuthorIds(): string[] {
    return useSyncExternalStore(subscribeMutedAuthors, getMutedAuthorIdsSnapshot, getMutedAuthorIdsSnapshot);
}
