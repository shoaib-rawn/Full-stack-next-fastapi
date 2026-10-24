import { LedgerLogo } from "@/components/ledger-logo";
import {
  ConceptStep,
  MiniCookie,
  MiniValidate,
  MiniVerify,
  RequestFlow,
  loginFlowNodes,
} from "@/components/concept-visuals";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#f5faff] px-4 py-6 text-[#0b2e59] sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-4xl border-2 border-[#83cff4] bg-white shadow-[0_18px_60px_rgba(11,46,89,0.16)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative overflow-hidden bg-linear-to-br from-[#073979] via-[#0e61b8] to-[#082d63] p-6 text-white sm:p-9">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[#ffd65a]/25" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <LedgerLogo className="size-12" />
              <div>
                <p className="text-xl font-black">LedgerLite</p>
                <p className="text-xs font-semibold text-[#cceaff]">Secure data journey</p>
              </div>
            </div>

            <p className="mt-10 inline-flex rounded-lg bg-[#ffd65a] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#082d63]">
              What happens here?
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight">
              A secure gate before accounting data.
            </h2>

            <div className="mt-8 grid gap-3">
              <ConceptStep number="1" title="Validate" caption="Hook Form + Zod">
                <MiniValidate />
              </ConceptStep>
              <ConceptStep number="2" title="Protect" caption="Next.js BFF cookies">
                <MiniCookie />
              </ConceptStep>
              <ConceptStep number="3" title="Verify" caption="FastAPI">
                <MiniVerify />
              </ConceptStep>
            </div>

            <div className="mt-6 rounded-xl border border-white/20 bg-white/10 p-4">
              <RequestFlow nodes={loginFlowNodes} dark />
            </div>
          </div>
        </aside>

        <div className="p-5 sm:p-9 lg:p-12">
          {children}
        </div>
      </div>
    </main>
  );
}

