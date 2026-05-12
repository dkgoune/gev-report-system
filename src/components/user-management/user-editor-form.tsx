"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { roleOptions } from "./constants";
import { serviceLabel } from "@/lib/services";
import type { GroupOption, Role, UserFormState } from "./types";

type UserEditorFormProps = {
  mode: "create" | "update";
  initialState: UserFormState;
  userId?: string;
  title: string;
  description: string;
  groups: GroupOption[];
};

export function UserEditorForm({
  mode,
  initialState,
  userId,
  title,
  description,
  groups,
}: UserEditorFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<UserFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const endpoint = mode === "create" ? "/api/users" : `/api/users/${userId}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const body =
      mode === "create"
        ? formState
        : {
            fullName: formState.fullName,
            username: formState.username,
            role: formState.role,
            groupId: formState.groupId || null,
            phone: formState.phone || null,
            isActive: formState.isActive,
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
            <span className="font-medium text-slate-700">Rôle</span>
            <select
              value={formState.role}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  role: event.target.value as Role,
                }))
              }
              className="w-full border border-slate-300 px-3 py-2"
            >
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Groupe</span>
            <select
              value={formState.groupId}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  groupId: event.target.value,
                }))
              }
              className="w-full border border-slate-300 px-3 py-2"
            >
              <option value="">
                {formState.role === "admin"
                  ? "Aucun groupe"
                  : "Choisir un groupe"}
              </option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({serviceLabel(group.service)})
                </option>
              ))}
            </select>
            <span className="block text-xs text-slate-500">
              Le groupe est obligatoire pour les rôles non administrateurs.
            </span>
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
