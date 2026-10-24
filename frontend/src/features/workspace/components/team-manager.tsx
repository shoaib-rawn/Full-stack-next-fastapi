"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { RequestAnimation, RequestOverlay } from "@/components/request-animation";
import { RevealZone } from "@/components/reveal-zone";

import { useCreateMember, useMembers, useUpdateMember, workspaceKeys } from "../hooks";
import { memberCreateSchema, type MemberCreateValues } from "../schemas";
import type { Member } from "../types";

const PAGE_SIZE = 10;
const inputClass =
  "w-full rounded-xl border-2 border-[#b8dbea] bg-[#f7fcff] px-4 py-3 text-[#0b2e59] outline-none focus:border-[#1267c9]";

export function TeamManager({ currentUserId }: { currentUserId: number }) {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const members = useMembers(page, PAGE_SIZE);
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberCreateValues>({
    resolver: zodResolver(memberCreateSchema),
    defaultValues: { full_name: "", email: "", password: "" },
  });

  async function onCreate(values: MemberCreateValues) {
    try {
      await createMember.mutateAsync(values);
      reset();
      setShowCreate(false);
      setPage(1);
    } catch {
      // TanStack Query keeps the error for the form and request overlay.
    }
  }

  async function toggleRole(member: Member) {
    try {
      await updateMember.mutateAsync({
        id: member.id,
        values: { role: member.role === "owner" ? "member" : "owner" },
      });
    } catch {
      // The mutation error is rendered below and inside the request overlay.
    }
  }

  async function toggleActive(member: Member) {
    try {
      await updateMember.mutateAsync({
        id: member.id,
        values: { is_active: !member.is_active },
      });
    } catch {
      // The mutation error is rendered below and inside the request overlay.
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid overflow-hidden rounded-3xl border-2 border-[#7fd3bd] bg-white shadow-[0_8px_0_rgba(8,45,99,0.07)] lg:grid-cols-[1fr_0.85fr]">
        <div className="bg-[#e0f5ef] p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0f8a6d]">Owner control</p>
          <h2 className="mt-3 text-3xl font-black text-[#082d63]">One company, controlled access</h2>
          <p className="mt-3 max-w-xl leading-7 text-[#58718c]">
            Members perform daily accounting. Owners can manage access and sensitive actions.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-[#073979] p-5 text-center text-white sm:p-7">
          {[
            ["1", "Tenant"],
            ["2", "Roles"],
            ["403", "Guard"],
          ].map(([value, label]) => (
            <div key={label} className="grid place-content-center rounded-2xl border border-white/20 bg-white/10 p-3">
              <strong className="text-2xl text-[#ffd65a]">{value}</strong>
              <span className="mt-1 text-xs font-black uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {!showCreate ? (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-[#159447] px-5 py-3 font-black text-white shadow-[0_4px_0_#17652f]"
        >
          + Add organization member
        </button>
      ) : (
        <form onSubmit={handleSubmit(onCreate)} className="rounded-3xl border-2 border-[#9bd884] bg-white p-5 shadow-[0_7px_0_rgba(8,45,99,0.07)] sm:p-7">
          <div className="grid gap-5 lg:grid-cols-3">
            <FormField label="Full name" error={errors.full_name?.message}>
              <input {...register("full_name")} placeholder="Ali Raza" className={inputClass} />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <input type="email" {...register("email")} placeholder="ali@example.com" className={inputClass} />
            </FormField>
            <FormField label="Temporary password" error={errors.password?.message}>
              <input type="password" {...register("password")} placeholder="At least 8 characters" className={inputClass} />
            </FormField>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button disabled={createMember.isPending} className="rounded-xl bg-[#159447] px-5 py-3 font-black text-white disabled:opacity-60">
              {createMember.isPending ? "Creating..." : "Create member"}
            </button>
            <button type="button" onClick={() => { reset(); setShowCreate(false); }} className="rounded-xl border-2 border-[#b8dbea] px-5 py-3 font-black text-[#58718c]">
              Cancel
            </button>
          </div>
          {createMember.isError && <ErrorBox message={createMember.error.message} />}
        </form>
      )}

      <RevealZone id="team-members" flow="members" queryKey={workspaceKeys.memberPage(page, PAGE_SIZE)}>
      <section className="overflow-hidden rounded-3xl border-2 border-[#72c8f1] bg-white shadow-[0_8px_0_rgba(8,45,99,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#b8dbea] bg-[#e5f6ff] p-5 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#1267c9]">Member directory</p>
            <h2 className="mt-1 text-2xl font-black text-[#082d63]">Team access</h2>
          </div>
          <span className="rounded-full bg-[#073979] px-4 py-2 text-sm font-black text-white">
            {members.data?.total ?? 0} {(members.data?.total ?? 0) === 1 ? "account" : "accounts"}
          </span>
        </div>

        {members.isPending && <p className="p-6 text-center text-sm font-bold text-[#7b93ab]">Loading…</p>}
        {members.isError && <div className="p-4 sm:p-6"><RequestAnimation flow="members" error={members.error.message} /></div>}
        {updateMember.isError && <ErrorBox message={updateMember.error.message} />}

        <div className="grid gap-3 p-4 sm:p-6">
          {members.data?.items.map((member) => {
            const isSelf = member.id === currentUserId;
            return (
              <article key={member.id} className="grid gap-4 rounded-2xl border-2 border-[#d7e7ef] p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-black text-[#082d63]">{member.full_name}</h3>
                    {isSelf && <span className="rounded-full bg-[#fff4c8] px-2 py-1 text-xs font-black text-[#7a5a05]">You</span>}
                    <span className={`rounded-full px-2 py-1 text-xs font-black uppercase ${member.role === "owner" ? "bg-[#e9f0ff] text-[#3046a8]" : "bg-[#e0f5ef] text-[#0f8a6d]"}`}>
                      {member.role}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${member.is_active ? "bg-[#dcf7e5] text-[#17652f]" : "bg-[#ffe3eb] text-[#a3234c]"}`}>
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-[#58718c]">{member.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={isSelf || updateMember.isPending} onClick={() => toggleRole(member)} className="rounded-lg border-2 border-[#1267c9] px-3 py-2 text-sm font-black text-[#1267c9] disabled:cursor-not-allowed disabled:opacity-40">
                    Make {member.role === "owner" ? "member" : "owner"}
                  </button>
                  <button type="button" disabled={isSelf || updateMember.isPending} onClick={() => toggleActive(member)} className={`rounded-lg border-2 px-3 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 ${member.is_active ? "border-[#d7344f] text-[#d7344f]" : "border-[#159447] text-[#159447]"}`}>
                    {member.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {members.data && members.data.pages > 1 && (
          <div className="flex items-center justify-center gap-4 border-t-2 border-[#d7e7ef] p-4">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border-2 border-[#1267c9] px-3 py-2 font-black text-[#1267c9] disabled:opacity-40">Previous</button>
            <span className="font-black text-[#082d63]">Page {members.data.page} of {members.data.pages}</span>
            <button type="button" disabled={page >= members.data.pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border-2 border-[#1267c9] px-3 py-2 font-black text-[#1267c9] disabled:opacity-40">Next</button>
          </div>
        )}
      </section>
      </RevealZone>

      <RequestOverlay
        flow="member-create"
        active={createMember.isPending}
        error={createMember.error?.message}
      />
      <RequestOverlay
        flow="member-update"
        active={updateMember.isPending}
        error={updateMember.error?.message}
      />
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-black text-[#163e6b]">
      <span className="mb-2 block">{label}</span>
      {children}
      {error && <span className="mt-2 block text-sm text-[#a3234c]">{error}</span>}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <p className="m-4 rounded-xl bg-[#ffe3eb] p-3 font-bold text-[#a3234c]">{message}</p>;
}
