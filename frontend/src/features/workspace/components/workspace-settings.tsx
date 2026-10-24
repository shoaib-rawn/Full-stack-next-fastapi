"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { RequestAnimation, RequestOverlay } from "@/components/request-animation";
import { RevealZone } from "@/components/reveal-zone";
import { clearSeen } from "@/lib/seen-sections";
import { withMinDuration } from "@/lib/demo-delay";
import { trackedFetch } from "@/lib/request-tracker";

import { useOrganization, useUpdateOrganization, workspaceKeys } from "../hooks";
import {
  organizationSchema,
  type OrganizationFormValues,
} from "../schemas";

const inputClass =
  "w-full rounded-xl border-2 border-[#b8dbea] bg-[#f7fcff] px-4 py-3 text-[#0b2e59] outline-none transition focus:border-[#1267c9] disabled:cursor-not-allowed disabled:bg-[#edf3f7] disabled:text-[#6b7f91]";

export function WorkspaceSettings({ isOwner }: { isOwner: boolean }) {
  const organization = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [logoutAllPending, setLogoutAllPending] = useState(false);
  const [logoutAllError, setLogoutAllError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (organization.data) {
      reset({
        name: organization.data.name,
        slug: organization.data.slug,
      });
    }
  }, [organization.data, reset]);

  async function onSubmit(values: OrganizationFormValues) {
    try {
      const updated = await updateOrganization.mutateAsync(values);
      reset({ name: updated.name, slug: updated.slug });
    } catch {
      // TanStack Query keeps the backend message for the form and overlay.
    }
  }

  async function logoutAll() {
    setLogoutAllPending(true);
    setLogoutAllError("");

    try {
      const response = await withMinDuration(
        trackedFetch("logout-all", "/api/auth/logout-all", { method: "POST" }),
      );
      const data = (await response.json()) as { detail?: string };

      if (!response.ok) {
        throw new Error(data.detail ?? "Could not log out all sessions.");
      }

      queryClient.clear();
      try {
        localStorage.removeItem("ledgerlite:last-activity");
      } catch {
        // Storage may be blocked; server-side revocation still succeeded.
      }
      clearSeen();
      router.replace("/login?reason=logout-all");
      router.refresh();
    } catch (error) {
      setLogoutAllError(
        error instanceof Error ? error.message : "Could not log out all sessions.",
      );
    } finally {
      setLogoutAllPending(false);
    }
  }

  if (organization.isPending) {
    return <SettingsSkeleton />;
  }

  if (organization.isError || !organization.data) {
    return (
      <RequestAnimation
        flow="organization"
        error={organization.error?.message ?? "Could not load organization settings."}
      />
    );
  }

  return (
    <RevealZone id="settings-organization" flow="organization" queryKey={workspaceKeys.organization}>
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="overflow-hidden rounded-3xl border-2 border-[#72c8f1] bg-white shadow-[0_8px_0_rgba(8,45,99,0.07)]"
      >
        <div className="border-b-2 border-[#b8dbea] bg-[#e5f6ff] p-5 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1267c9]">
            Tenant profile
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#082d63]">
            Organization identity
          </h2>
          <p className="mt-2 text-[#58718c]">
            Every customer, invoice and payment is isolated under this workspace.
          </p>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-2">
          <Field label="Organization name" error={errors.name?.message}>
            <input {...register("name")} disabled={!isOwner} className={inputClass} />
          </Field>
          <Field label="Unique slug" error={errors.slug?.message}>
            <input {...register("slug")} disabled={!isOwner} className={inputClass} />
          </Field>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-[#d7e7ef] pt-5">
            {isOwner ? (
              <button
                type="submit"
                disabled={!isDirty || updateOrganization.isPending}
                className="rounded-xl bg-[#1267c9] px-5 py-3 font-black text-white shadow-[0_4px_0_#073979] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateOrganization.isPending ? "Saving..." : "Save organization"}
              </button>
            ) : (
              <span className="rounded-xl bg-[#fff4c8] px-4 py-3 text-sm font-black text-[#7a5a05]">
                View only — an owner manages organization identity.
              </span>
            )}
            {updateOrganization.isSuccess && !isDirty && (
              <span className="font-bold text-[#0f8a6d]">Changes saved.</span>
            )}
          </div>

          {updateOrganization.isError && (
            <p className="md:col-span-2 rounded-xl bg-[#ffe3eb] p-3 font-bold text-[#a3234c]">
              {updateOrganization.error.message}
            </p>
          )}
        </div>
      </form>

      <section className="rounded-3xl border-2 border-[#f0c557] bg-[#fff9df] p-5 shadow-[0_8px_0_rgba(8,45,99,0.07)] sm:p-7">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#073979] text-xl text-white">
          ⛨
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[#7a5a05]">
          Session security
        </p>
        <h2 className="mt-2 text-2xl font-black text-[#082d63]">Log out every device</h2>
        <p className="mt-3 leading-7 text-[#58718c]">
          Revokes all refresh tokens, increments your token version and rejects existing access tokens on their next request.
        </p>
        <button
          type="button"
          onClick={logoutAll}
          disabled={logoutAllPending}
          className="mt-6 w-full rounded-xl bg-[#d7344f] px-5 py-3 font-black text-white shadow-[0_4px_0_#9c1f38] disabled:opacity-60"
        >
          {logoutAllPending ? "Revoking sessions..." : "Log out all devices"}
        </button>
        {logoutAllError && (
          <p className="mt-3 rounded-xl bg-[#ffe3eb] p-3 text-sm font-bold text-[#a3234c]">
            {logoutAllError}
          </p>
        )}
      </section>

      <RequestOverlay
        flow="organization-update"
        active={updateOrganization.isPending}
        error={updateOrganization.error?.message}
      />
      <RequestOverlay
        flow="logout-all"
        active={logoutAllPending}
        error={logoutAllError}
      />
    </div>
    </RevealZone>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-black text-[#163e6b]">
      <span className="mb-2 block">{label}</span>
      {children}
      {error && (
        <span className="mt-2 block rounded-lg bg-[#ffe3eb] px-3 py-2 text-sm text-[#a3234c]">
          {error}
        </span>
      )}
    </label>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="h-96 rounded-3xl bg-[#dcecf5]" />
      <div className="h-80 rounded-3xl bg-[#fff0b5]" />
    </div>
  );
}
