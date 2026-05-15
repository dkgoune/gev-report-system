"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { UserPermission } from "@/generated/prisma/browser";
import { allPermissions } from "@/lib/permissions";
import type { UserFormState } from "./types";

type UserEditorFormProps = {
  mode: "create" | "update";
  initialState: UserFormState;
  userId?: string;
  title: string;
  description: string;
  canEditPermissions?: boolean;
};

export function UserEditorForm({
  mode,
  initialState,
  userId,
  title,
  description,
  canEditPermissions = false,
}: UserEditorFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<UserFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  const permissionGroups = useMemo(() => {
    const groups: {
      key: string;
      title: string;
      items: { value: UserPermission; label: string }[];
    }[] = [
      { key: "dashboard", title: "Tableau de bord", items: [] },
      { key: "user", title: "Personnel", items: [] },
      { key: "service", title: "Services", items: [] },
      { key: "post", title: "Postes", items: [] },
      { key: "work_schedule", title: "Plannings", items: [] },
      { key: "report", title: "Rapports", items: [] },
      { key: "incident", title: "Incidents", items: [] },
      { key: "criteria", title: "Critères", items: [] },
      { key: "evaluation", title: "Évaluations", items: [] },
      { key: "signature", title: "Signatures", items: [] },
      { key: "settings", title: "Paramètres", items: [] },
      { key: "agency", title: "Agences", items: [] },
      { key: "other", title: "Autres", items: [] },
    ];

    const getKey = (permission: UserPermission): string => {
      if (permission.startsWith("work_schedule_")) {
        return "work_schedule";
      }

      return permission.split("_")[0] || "other";
    };

    for (const permission of allPermissions) {
      const key = getKey(permission.value);
      const group = groups.find(entry => entry.key === key);

      if (group) {
        group.items.push(permission);
      } else {
        groups.find(entry => entry.key === "other")?.items.push(permission);
      }
    }

    return groups.filter(group => group.items.length > 0);
  }, []);

  function togglePermission(permission: UserPermission) {
    setFormState(current => {
      const hasPermission = current.permissions.includes(permission);
      const nextPermissions = hasPermission
        ? current.permissions.filter(item => item !== permission)
        : [...current.permissions, permission];

      return {
        ...current,
        permissions: nextPermissions,
      };
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const endpoint = mode === "create" ? "/api/users" : `/api/users/${userId}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const body =
      mode === "create"
        ? {
            ...formState,
            permissions: formState.permissions,
          }
        : {
            fullName: formState.fullName,
            username: formState.username,
            phone: formState.phone || null,
            isActive: formState.isActive,
            permissions: formState.permissions,
          };

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(
        payload?.error ||
          (mode === "create"
            ? "Impossible de créer le personnel."
            : "Impossible de mettre à jour le personnel.")
      );
      setSubmitting(false);
      return;
    }

    toast.success(
      mode === "create"
        ? "Personnel créé avec succès."
        : "Personnel mis à jour."
    );

    setSubmitting(false);
    router.push("/users");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/users">Retour a la liste</Link>
        </Button>
      </div>

      <section className="border border-slate-200 bg-slate-50 p-4">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Nom complet</span>
            <input
              value={formState.fullName}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
              className="w-full border border-slate-300 px-3 py-2"
              required
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Nom utilisateur</span>
            <input
              value={formState.username}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              className="w-full border border-slate-300 px-3 py-2"
              required
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Téléphone</span>
            <input
              value={formState.phone}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              className="w-full border border-slate-300 px-3 py-2"
            />
          </label>

          {mode === "create" ? (
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Mot de passe</span>
              <input
                type="password"
                value={formState.password}
                onChange={event =>
                  setFormState(current => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                className="w-full border border-slate-300 px-3 py-2"
                minLength={6}
                required
              />
            </label>
          ) : null}

          <label className="flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            <span>Compte actif</span>
          </label>

          <section className="space-y-3 border border-slate-300 bg-white p-3 md:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Permissions utilisateur
                </h3>
                <p className="text-xs text-slate-600">
                  Sélectionnez les droits accordés a ce personnel.
                </p>
              </div>

              <div className="flex gap-2">
                {/* <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFormState(current => ({
                      ...current,
                      permissions: allPermissions.map(item => item.value),
                    }))
                  }
                >
                  Tout sélectionner
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFormState(current => ({
                      ...current,
                      permissions: [],
                    }))
                  }
                >
                  Tout retirer
                </Button> */}
              </div>
            </div>

            {canEditPermissions && (
              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {permissionGroups.map(group => (
                  <fieldset
                    key={group.key}
                    className="space-y-2 border border-slate-200 bg-slate-50 p-3"
                  >
                    <legend className="px-1 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      {group.title}
                    </legend>

                    <div className="grid gap-2">
                      {group.items.map(permission => (
                        <label
                          key={permission.value}
                          className="flex items-start gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={formState.permissions.includes(
                              permission.value
                            )}
                            onChange={() => togglePermission(permission.value)}
                            className="mt-0.5"
                          />
                          <span className="text-slate-700">
                            {permission.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            )}
          </section>

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting
                ? mode === "create"
                  ? "Création..."
                  : "Enregistrement..."
                : mode === "create"
                  ? "Créer le personnel"
                  : "Mettre a jour le personnel"}
            </Button>
            <Button asChild variant="outline" disabled={submitting}>
              <Link href="/users">Annuler</Link>
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
