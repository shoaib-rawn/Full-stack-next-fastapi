import Link from "next/link";

export default function CustomerNotFound() {
  return (
    <main className="mx-auto max-w-3xl p-6 text-center text-[#0b2e59]">
      <section className="rounded-3xl border-2 border-[#f1a8bc] bg-[#ffe3eb] p-10 shadow-[0_8px_0_rgba(163,35,76,0.1)]">
      <p className="inline-flex rounded-full bg-[#d7344f] px-4 py-2 text-sm font-black text-white">
        404
      </p>

      <h1 className="mt-4 text-3xl font-black text-[#082d63]">
        Customer not found
      </h1>

      <p className="mt-3 text-[#7d4255]">
        This customer ID is invalid or unavailable.
      </p>

      <Link
        href="/customers"
        className="mt-6 inline-block rounded-xl bg-[#1267c9] px-5 py-3 font-black text-white shadow-[0_4px_0_#082d63]"
      >
        Return to customers
      </Link>
      </section>
    </main>
  );
}
