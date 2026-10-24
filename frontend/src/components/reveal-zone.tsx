"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useQueryClient, type QueryFunction, type QueryKey } from "@tanstack/react-query";

import { RequestAnimation, type FlowName } from "@/components/request-animation";
import { withMinDuration } from "@/lib/demo-delay";
import {
  getSeenServerSnapshot,
  getSeenSnapshot,
  isSeen,
  markSeen,
  subscribeSeen,
} from "@/lib/seen-sections";

// A section that starts smoky. Hovering it (mouse) or touching it (phone)
// replays its real request with the request animation; then it turns clear
// and stays clear, across refreshes and back navigation, until logout.
export function RevealZone({
  id,
  flow,
  queryKey,
  className = "",
  children,
}: {
  /** Unique per page section, e.g. "invoices-list" or "customer-12". */
  id: string;
  flow: FlowName;
  /** The query whose request is replayed during the animation. */
  queryKey: QueryKey;
  className?: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const snapshot = useSyncExternalStore(subscribeSeen, getSeenSnapshot, getSeenServerSnapshot);
  const seen = isSeen(snapshot, id);
  const [playing, setPlaying] = useState(false);
  // Only fade in when the user revealed it here; a remembered section is
  // simply clear, with no fade on refresh.
  const [revealedNow, setRevealedNow] = useState(false);
  const started = useRef(false);
  const mounted = useRef(true);
  // A tap that starts the animation should not also follow a link inside.
  const tapStartedAt = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function play(byTouch = false) {
    if (seen || started.current) return;
    started.current = true;
    if (byTouch) tapStartedAt.current = Date.now();
    setPlaying(true);

    const queryFn = queryClient.getQueryCache().find({ queryKey, exact: true })?.options
      .queryFn as QueryFunction | undefined;

    const replay = queryFn
      ? queryClient.fetchQuery({
          queryKey,
          queryFn: (context) => withMinDuration(Promise.resolve(queryFn(context))),
          staleTime: 0,
        })
      : withMinDuration(Promise.resolve());

    void replay
      .catch(() => undefined)
      // Short pause so the finished flow can be seen before it closes.
      .then(() => new Promise((resolve) => setTimeout(resolve, 900)))
      .finally(() => {
        markSeen(id);
        if (!mounted.current) return;
        setRevealedNow(true);
        setPlaying(false);
      });
  }

  if (seen && !playing) {
    return (
      <div className={`${revealedNow ? "ll-reveal" : ""} ${className}`}>{children}</div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      // pointermove (not pointerenter) so a cursor already resting on the
      // page when it loads does not start the animation by itself.
      onPointerMove={(event) => {
        if (event.pointerType === "mouse") play();
      }}
      onTouchStart={() => play(true)}
      // Keyboard users reveal it by tabbing into the section.
      onFocusCapture={() => play()}
      onClickCapture={(event) => {
        if (Date.now() - tapStartedAt.current < 800) {
          event.preventDefault();
          event.stopPropagation();
          tapStartedAt.current = 0;
        }
      }}
    >
      <p className="mb-2 flex justify-end text-[11px] font-black uppercase tracking-wider text-[#7b93ab]">
        <span className="rounded-full bg-white px-2.5 py-1 shadow-[0_2px_0_rgba(8,45,99,0.06)] ring-1 ring-[#d9edf7]">
          ▶ <span className="[@media(hover:none)]:hidden">Hover</span>
          <span className="hidden [@media(hover:none)]:inline">Tap</span> to watch this request
        </span>
      </p>
      <div
        className={`pointer-events-none select-none opacity-60 blur-[3px] saturate-50 ${
          playing ? "min-h-[26rem] sm:min-h-[22rem]" : ""
        }`}
      >
        {children}
      </div>
      {playing && (
        <div className="absolute inset-x-0 bottom-0 top-8 z-10 overflow-y-auto rounded-3xl bg-[#f5faff] p-2 sm:p-4">
          <RequestAnimation flow={flow} />
        </div>
      )}
    </div>
  );
}

// Quiet stand-in while a section's data loads for the first time. The request
// animation is saved for when the user asks for it.
export function QuietLoading({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      className={`grid min-h-40 place-items-center rounded-3xl border-2 border-[#d9edf7] bg-white text-sm font-bold text-[#7b93ab] ${className}`}
    >
      Loading…
    </div>
  );
}
