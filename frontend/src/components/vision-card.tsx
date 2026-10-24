import Image from "next/image";

// "My vision" toggle at the top of the landing page. Native <details> keeps it
// accessible and works without client JavaScript.
export function VisionCard() {
  return (
    <details className="group mx-auto mt-4 overflow-hidden rounded-2xl border border-white/25 bg-white/10 shadow-xl backdrop-blur open:bg-white/15">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 sm:px-5 [&::-webkit-details-marker]:hidden">
        <Image
          src="/profile.jpg"
          alt=""
          width={40}
          height={40}
          className="size-9 shrink-0 rounded-full object-cover ring-2 ring-[#ffd65a] group-open:hidden sm:size-10"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-white sm:text-base">My vision</span>
          <span className="block text-xs leading-4 text-[#cceaff]">
            Why I started my journey in tech
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-[#ffd65a] px-3 py-1 text-[11px] font-black text-[#082d63] shadow-[0_3px_0_#be850b] sm:text-xs">
          <span className="group-open:hidden">Read</span>
          <span className="hidden group-open:inline">Close</span>
          <span aria-hidden className="ml-1 inline-block transition group-open:rotate-180">⌄</span>
        </span>
      </summary>

      <div className="grid grid-cols-1 items-center gap-5 border-t border-white/20 px-4 pb-6 pt-5 text-center sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8 sm:px-8 sm:pb-8 sm:pt-6 sm:text-left [&>*]:min-w-0">
        <div className="relative mx-auto">
          <div className="absolute -inset-2 rounded-full bg-linear-to-br from-[#ffd65a] via-[#69ccf5] to-[#ffd65a] opacity-80 blur-md" />
          <Image
            src="/profile.jpg"
            alt="Portrait of the LedgerLite author"
            width={240}
            height={240}
            className="relative size-32 rounded-full border-4 border-white object-cover shadow-2xl sm:size-44"
          />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffd65a]">
            My vision
          </p>
          <blockquote className="mt-3 text-base leading-7 text-white sm:text-lg sm:leading-8">
            <span className="font-black">My vision is simple: to help others.</span>{" "}
            I realised that before I could truly help anyone, I first had to
            build the skills myself, and that is why I started my journey in
            tech. LedgerLite is where it came together: the request flows, the
            fundamentals and how every layer of a full-stack app connects.
          </blockquote>
          <p className="mt-3 text-sm leading-6 text-[#d7edff] sm:text-base sm:leading-7">
            I am grateful to everyone who helped me along the way, especially{" "}
            <strong className="text-white">PSEB</strong>, the{" "}
            <strong className="text-white">Ministry of IT &amp; Telecom</strong> and{" "}
            <strong className="text-white">COMSTECH</strong>.
          </p>
        </div>
      </div>
    </details>
  );
}
