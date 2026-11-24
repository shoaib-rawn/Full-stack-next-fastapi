export const LEDGERBOT_RESET_EVENT = "ledgerbot:reset";
export const LEDGERBOT_RESET_STORAGE_KEY = "ledgerlite:chat-session-change";

export function resetLedgerBotSession() {
  window.dispatchEvent(new Event(LEDGERBOT_RESET_EVENT));
  try {
    localStorage.setItem(LEDGERBOT_RESET_STORAGE_KEY, crypto.randomUUID());
  } catch {
    // The current tab still receives the reset event if storage is disabled.
  }
}
