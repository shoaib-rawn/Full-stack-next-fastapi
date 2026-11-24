"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { id: number; role: "user" | "assistant"; text: string };

export function LedgerLiteAgent() {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [asking, setAsking] = useState(false);
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [accessMode, setAccessMode] = useState<"account" | "guest" | "registration" | null>(null);
  const [guestError, setGuestError] = useState("");
  const [registering, setRegistering] = useState(false);
  const chatList = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(0);

  function addMessage(role: ChatMessage["role"], text: string) {
    setMessages((current) => [...current, { id: ++nextMessageId.current, role, text }]);
  }

  useEffect(() => {
    if (open && messages.length && chatList.current) {
      chatList.current.scrollTo({ top: chatList.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch("/api/assistant/chat", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { available?: boolean }) => { if (active) setAiReady(Boolean(data.available)); })
      .catch(() => { if (active) setAiReady(false); });
    fetch("/api/assistant/guest", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { mode?: "account" | "guest" | "registration"; detail?: string };
        if (!response.ok) throw new Error(data.detail ?? "Could not check chat access.");
        if (active) setAccessMode(data.mode ?? "registration");
      })
      .catch((error) => { if (active) setGuestError(error instanceof Error ? error.message : "Could not check chat access."); });
    return () => { active = false; };
  }, [open]);

  async function registerGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (registering) return;
    setGuestError("");
    setRegistering(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/assistant/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.get("full_name"),
          email: form.get("email"),
          phone: form.get("phone"),
        }),
      });
      const data = await response.json() as { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Could not start guest chat.");
      setAccessMode("guest");
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : "Could not start guest chat.");
    } finally {
      setRegistering(false);
    }
  }

  async function askLedgerBot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = question.trim();
    if (prompt.length < 2 || asking) return;
    setAsking(true);
    addMessage("user", prompt);
    setQuestion("");
    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt }),
      });
      const data = await response.json() as { answer?: string; detail?: string };
      if (response.status === 401 && accessMode === "guest") setAccessMode("registration");
      addMessage("assistant", response.ok ? (data.answer ?? "No answer returned.") : (data.detail ?? "Could not answer right now."));
    } catch {
      addMessage("assistant", "Could not connect. Please try again.");
    } finally {
      setAsking(false);
    }
  }

  async function loadSnapshot() {
    setLoading(true);
    try {
      const response = await fetch("/api/assistant/context", { cache: "no-store" });
      const data = await response.json() as { invoiceCount?: number; detail?: string };
      setSnapshot(response.ok ? `Your workspace has ${data.invoiceCount ?? 0} invoices.` : (data.detail ?? "Could not load your data."));
    } catch {
      setSnapshot("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 max-h-[min(34rem,calc(100dvh-8rem))] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl border border-[#83cff4] bg-white p-5 text-[#082d63] shadow-2xl" role="dialog" aria-label="LedgerLite assistant">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-lg">Meet LedgerBot</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="grid size-8 place-items-center rounded-full bg-[#e5f6ff] text-xl">×</button>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#58718c]">{aiReady ? "Ask about Dashboard, customers, invoices, and payments." : "Your LedgerLite helper."}</p>
          {guestError && <p className="mt-3 rounded-xl bg-[#fff4c8] p-3 text-sm font-semibold" role="alert">{guestError}</p>}
          {aiReady === null && <p className="mt-3 text-sm text-[#58718c]">Checking chat availability...</p>}
          {aiReady === false && <p className="mt-3 rounded-xl bg-[#fff4c8] p-3 text-sm font-semibold">AI chat is temporarily unavailable. Please try again later.</p>}
          {aiReady && accessMode === "registration" && <form onSubmit={registerGuest} className="mt-4 space-y-3">
            <p className="text-sm font-semibold">First time here? Enter your details to start a guest chat.</p>
            <label className="block text-sm font-bold">Name<input name="full_name" required minLength={2} maxLength={100} autoComplete="name" className="mt-1 w-full rounded-xl border border-[#a7cde2] p-3 font-normal" /></label>
            <label className="block text-sm font-bold">Email<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border border-[#a7cde2] p-3 font-normal" /></label>
            <label className="block text-sm font-bold">Phone<input name="phone" type="tel" required minLength={8} maxLength={20} autoComplete="tel" className="mt-1 w-full rounded-xl border border-[#a7cde2] p-3 font-normal" /></label>
            <p className="text-xs leading-5 text-[#58718c]">Name, email and phone are saved in our database until removed. They are not sent to the AI model, and chat messages are not stored. Guest access lasts 24 hours.</p>
            <button type="submit" disabled={registering} className="rounded-xl bg-[#1267c9] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{registering ? "Saving..." : "Start guest chat"}</button>
          </form>}
          {aiReady && accessMode !== null && accessMode !== "registration" && messages.length > 0 && <div ref={chatList} className="mt-4 flex max-h-64 flex-col gap-3 overflow-y-auto rounded-2xl bg-[#f4f9fd] p-3" role="log" aria-label="LedgerBot conversation" aria-live="polite">
            {messages.map((message) => <div key={message.id} className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-6 ${message.role === "user" ? "self-end rounded-br-sm bg-[#1267c9] text-white" : "self-start rounded-bl-sm bg-white text-[#082d63] shadow-sm"}`}>
              {message.text}
            </div>)}
            {asking && <div className="self-start rounded-2xl bg-white px-3 py-2 text-sm text-[#58718c]">LedgerBot is thinking...</div>}
          </div>}
          {aiReady && accessMode !== null && accessMode !== "registration" && <form onSubmit={askLedgerBot} className="mt-4 space-y-2">
            <label htmlFor="ledgerbot-question" className="text-sm font-bold">Your message</label>
            <textarea id="ledgerbot-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={500} rows={2} placeholder="Ask LedgerBot..." className="w-full resize-none rounded-xl border border-[#a7cde2] p-3 text-sm outline-none focus:border-[#1267c9]" />
            <button type="submit" disabled={asking || question.trim().length < 2} className="rounded-xl bg-[#1267c9] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{asking ? "Thinking..." : "Send"}</button>
          </form>}
          {aiReady && accessMode !== null && accessMode !== "registration" && <p className="mt-4 text-xs font-semibold text-[#58718c]">AI answers explain the app; they do not read or change your records. Avoid private details in questions.</p>}
          {accessMode === "account" && <button type="button" onClick={loadSnapshot} disabled={loading} className="mt-3 rounded-xl bg-[#082d63] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{loading ? "Loading..." : "Show my invoice snapshot"}</button>}
          {snapshot && <p className="mt-3 rounded-xl bg-[#e5f6ff] p-3 text-sm font-semibold" role="status">{snapshot}</p>}
        </div>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close LedgerBot" : "Open LedgerBot"} className="group grid size-20 place-items-center rounded-full bg-transparent transition-transform hover:scale-110 focus-visible:outline-4 focus-visible:outline-[#ffd65a]">
        <span className="ll-agent-float relative block h-[76px] w-[72px] drop-shadow-[0_8px_9px_rgba(4,32,64,.3)]" aria-hidden="true">
          <span className="absolute left-[35px] top-0 h-3 w-0.5 bg-white" />
          <span className="absolute left-[33px] top-0 size-1.5 rounded-full bg-[#ffd65a]" />
          <span className="absolute left-1 top-8 h-7 w-2 -rotate-[30deg] rounded-full bg-white" />
          <span className="absolute right-1 top-8 h-7 w-2 rotate-[30deg] rounded-full bg-white" />
          <span className="absolute left-4 top-[42px] h-8 w-10 rounded-b-2xl rounded-t-lg border-2 border-[#cfebf4] bg-white" />
          <span className="absolute left-[7px] top-2 grid h-[48px] w-[58px] place-items-center rounded-[20px] border-[5px] border-white bg-[#182943] shadow-[inset_0_0_0_2px_#93c7d8]">
            <span className="absolute top-[18px] flex gap-3"><i className="size-1.5 rounded-full bg-[#26e99c]" /><i className="size-1.5 rounded-full bg-[#26e99c]" /></span>
            <span className="absolute bottom-[9px] h-2 w-4 rounded-b-full border-b-[3px] border-[#26e99c]" />
          </span>
        </span>
      </button>
    </aside>
  );
}
