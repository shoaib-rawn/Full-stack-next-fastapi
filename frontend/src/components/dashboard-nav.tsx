"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";

type IconName =
  | "dashboard"
  | "customers"
  | "invoices"
  | "team"
  | "settings"
  | "journey"
  | "notebook";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  ownerOnly?: boolean;
};

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/customers", label: "Customers", icon: "customers" },
      { href: "/invoices", label: "Invoices", icon: "invoices" },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/team", label: "Team", icon: "team", ownerOnly: true },
      { href: "/settings", label: "Settings", icon: "settings" },
    ],
  },
  {
    title: "Learning",
    items: [
      { href: "/journey", label: "Journey", icon: "journey" },
      { href: "/notebook", label: "Notebook", icon: "notebook" },
    ],
  },
];

// 24x24 outline icons (stroke = currentColor), so they follow the link colour.
const iconPaths: Record<IconName, string> = {
  dashboard: "M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z",
  customers:
    "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10 9v-1.5a3.5 3.5 0 0 0-2.5-3.35M15 4.15a3.5 3.5 0 0 1 0 6.7",
  invoices:
    "M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v4h4M9 12h6M9 16h6M9 8h2",
  team: "M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-3Zm-3 9 2 2 4-4",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  journey: "M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 17h7a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h7",
  notebook:
    "M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6V3Zm0 0H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h1M10 8h5M10 12h5",
};

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

const linkStyles = {
  base: "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#b9d3f0] transition hover:bg-white/8 hover:text-white",
  active: "group relative flex items-center gap-3 rounded-xl bg-white/12 px-3 py-2.5 text-sm font-black text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
};

type NavLinkProps = NavItem & { onClick?: () => void };

// usePathname() is runtime URL data, so Next.js needs it inside Suspense.
// The fallback is the same link without the active highlight.
function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<PlainNavLink {...props} active={false} />}>
      <ActiveNavLink {...props} />
    </Suspense>
  );
}

function ActiveNavLink(props: NavLinkProps) {
  const pathname = usePathname();
  const active =
    pathname === props.href || pathname.startsWith(`${props.href}/`);

  return <PlainNavLink {...props} active={active} />;
}

function PlainNavLink({
  href,
  label,
  icon,
  onClick,
  active,
}: NavLinkProps & { active: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={active ? linkStyles.active : linkStyles.base}
    >
      {active && (
        <span aria-hidden className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[#ffd65a]" />
      )}
      <span className={active ? "text-[#ffd65a]" : "text-[#7fa6cf] group-hover:text-white"}>
        <NavIcon name={icon} />
      </span>
      {label}
    </Link>
  );
}

export type NavUser = {
  fullName: string;
  email: string;
  role: string;
};

function NavSections({
  isOwner,
  onNavigate,
  compact = false,
}: {
  isOwner: boolean;
  onNavigate?: () => void;
  // Phone menu: two columns and tighter spacing so everything fits on screen.
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {sections.map((section) => {
        const items = section.items.filter((item) => !item.ownerOnly || isOwner);
        if (!items.length) return null;

        return (
          <div key={section.title}>
            <p className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#6f93bb]">
              {section.title}
            </p>
            <div className={compact ? "mt-1 grid grid-cols-2 gap-1" : "mt-2 grid gap-1"}>
              {items.map((item) => (
                <NavLink key={item.href} {...item} onClick={onNavigate} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-[#ffd65a] text-sm font-black text-[#082d63] shadow-[0_3px_0_#be850b]">
        LL
      </span>
      <span>
        <span className="block text-lg font-black leading-5 text-white">LedgerLite</span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#7fa6cf]">
          Accounting
        </span>
      </span>
    </Link>
  );
}

function UserCard({ user }: { user?: NavUser }) {
  const initials =
    user?.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "LL";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1267c9] text-sm font-black text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{user?.fullName ?? "Signed in"}</p>
          <p className="truncate text-xs text-[#9fc0e3]">{user?.email ?? ""}</p>
        </div>
      </div>
      {user && (
        <span className="mt-3 inline-flex rounded-full bg-[#ffd65a]/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#ffd65a]">
          {user.role}
        </span>
      )}
      <div className="mt-3">
        <LogoutButton fullWidth />
      </div>
    </div>
  );
}

export function DashboardNavSkeleton() {
  return (
    <>
      <aside
        aria-label="Loading navigation"
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-linear-to-b from-[#062a5c] via-[#073979] to-[#05224a] px-5 py-6 lg:flex"
      >
        <Brand />
        <div className="mt-10 grid animate-pulse gap-7">
          {[3, 2, 2].map((count, sectionIndex) => (
            <div key={sectionIndex}>
              <div className="h-2.5 w-24 rounded bg-white/15" />
              <div className="mt-4 grid gap-3">
                {Array.from({ length: count }, (_, itemIndex) => (
                  <div key={itemIndex} className="h-10 rounded-xl bg-white/8" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto h-32 animate-pulse rounded-2xl bg-white/8" />
      </aside>

      <header className="sticky top-0 z-40 border-b-4 border-[#ffd65a] bg-linear-to-r from-[#073979] via-[#1267c9] to-[#073979] px-4 py-3 text-white shadow-lg lg:hidden sm:px-6">
        <div className="flex items-center justify-between">
          <Brand />
          <span className="size-11 animate-pulse rounded-xl bg-white/15" />
        </div>
      </header>
    </>
  );
}

// Desktop (lg and up): a fixed left sidebar. Smaller screens: a top bar with
// a menu button that opens the same grouped links.
export function DashboardNav({
  isOwner = false,
  user,
}: {
  isOwner?: boolean;
  user?: NavUser;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // While the phone menu is open, keep the page behind it still and let
  // Escape close it.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-linear-to-b from-[#062a5c] via-[#073979] to-[#05224a] px-5 py-6 lg:flex">
        <Brand />
        <nav aria-label="Main" className="mt-8 flex-1 overflow-y-auto pr-1">
          <NavSections isOwner={isOwner} />
        </nav>
        <UserCard user={user} />
      </aside>

      <header className="sticky top-0 z-40 border-b-4 border-[#ffd65a] bg-linear-to-r from-[#073979] via-[#1267c9] to-[#073979] text-white shadow-lg lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Brand />
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="dashboard-mobile-menu"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="grid size-11 place-items-center rounded-xl border-2 border-white/60 bg-white/10 transition hover:bg-white/20"
          >
            <span className="relative block h-4 w-5">
              <span className={`absolute left-0 h-0.5 w-5 rounded bg-white transition ${isOpen ? "top-1.75 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.75 h-0.5 w-5 rounded bg-white transition ${isOpen ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-0.5 w-5 rounded bg-white transition ${isOpen ? "top-1.75 -rotate-45" : "top-3.5"}`} />
            </span>
          </button>
        </div>

        {isOpen && (
          <nav
            id="dashboard-mobile-menu"
            aria-label="Main"
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-72px)] overflow-y-auto overscroll-contain border-b-4 border-[#ffd65a] bg-[#073979] px-4 pb-4 pt-3 shadow-lg sm:px-5 sm:pb-5 sm:pt-4"
          >
            <NavSections isOwner={isOwner} onNavigate={() => setIsOpen(false)} compact />
            <div className="mt-4">
              <UserCard user={user} />
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
