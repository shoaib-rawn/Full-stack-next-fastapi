// Remembers which page sections the user has already "revealed" (watched the
// request animation once). Kept in localStorage so it survives refreshes and
// back navigation, and cleared on login and logout so every session starts fresh.

const KEY = "ledgerlite:seen-sections";
const EVENT = "ledgerlite:seen-sections";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function subscribeSeen(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

// Snapshot is the raw string so useSyncExternalStore gets a stable value.
export const getSeenSnapshot = read;
export const getSeenServerSnapshot = () => null;

export function isSeen(snapshot: string | null, id: string) {
  if (snapshot === null) return false;
  try {
    return (JSON.parse(snapshot) as string[]).includes(id);
  } catch {
    return false;
  }
}

export function markSeen(id: string) {
  try {
    const ids = new Set(JSON.parse(read()) as string[]);
    ids.add(id);
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // Storage blocked: the section simply stays clear for this page view.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearSeen() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
