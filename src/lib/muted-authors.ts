// "Masquer" (mute) has no backing API mutation — confirmed by this
// session's audit, nothing to build there for now. This is a purely
// local, per-device preference (same honesty pattern already used for
// the "coming soon" screens' notify-me localStorage ack): never
// promised as a real server-side filter, just hides an author's posts
// from this browser's feed.

const STORAGE_KEY = "pmsconnect_muted_authors";
const EMPTY_IDS: string[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

function readFromStorage(): string[] {
  if (typeof window === "undefined") return EMPTY_IDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : EMPTY_IDS;
  } catch {
    return EMPTY_IDS;
  }
}

let cachedIds: string[] = readFromStorage();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedIds));
  } catch {
    // ignore (private browsing, storage disabled, etc.)
  }
  listeners.forEach((listener) => listener());
}

export function muteAuthor(authorId: string): void {
  if (!cachedIds.includes(authorId)) {
    cachedIds = [...cachedIds, authorId];
    persist();
  }
}

export function isAuthorMuted(authorId: string): boolean {
  return cachedIds.includes(authorId);
}

export function getMutedAuthorIdsSnapshot(): string[] {
  return cachedIds;
}

export function subscribeMutedAuthors(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
