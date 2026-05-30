"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { UserFormState, RoleItem } from "./types";

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
}: UserEditorFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<UserFormState>(initialState);
  const [agencies, setAgencies] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch all agencies
    fetch("/api/agencies")
      .then(res => res.json())
      .then(data => {
        if (data && data.agencies) {
          setAgencies(data.agencies.filter((a: { id: string; name: string; code: string; isActive: boolean }) => a.isActive));
        }
      })
      .catch(err => {
        console.error("Error fetching agencies:", err);
      });

    // 2. Fetch all roles
    fetch("/api/roles?all=true")
      .then(res => res.json())
      .then(data => {
        if (data && data.roles) {
          setAvailableRoles(data.roles);
        }
      })
      .catch(err => {
        console.error("Error fetching roles:", err);
      });
  }, []);

  const memberships = formState.memberships || [];

  function isMemberOf(agencyId: string) {
    return memberships.some(m => m.agencyId === agencyId);
  }

  function toggleMembership(agencyId: string) {
    setFormState(current => {
      const currentMemberships = current.memberships || [];
      const exists = currentMemberships.some(m => m.agencyId === agencyId);
      
      const nextMemberships = exists
        ? currentMemberships.filter(m => m.agencyId !== agencyId)
        : [...currentMemberships, { agencyId, isActive: true, roleIds: [] }];

      return {
        ...current,
        memberships: nextMemberships,
      };
    });
  }

  function toggleRoleForAgency(agencyId: string, roleId: string) {
    setFormState(current => {
      const currentMemberships = current.memberships || [];
      const nextMemberships = currentMemberships.map(m => {
        if (m.agencyId === agencyId) {
          const hasRole = m.roleIds.includes(roleId);
          const nextRoleIds = hasRole
            ? m.roleIds.filter(id => id !== roleId)
            : [...m.roleIds, roleId];
          return { ...m, roleIds: nextRoleIds };
        }
        return m;
      });

      return {
        ...current,
        memberships: nextMemberships,
      };
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (memberships.length === 0) {
      toast.error("Veuillez lier cet utilisateur à au moins une agence.");
      return;
    }

    setSubmitting(true);

    const endpoint = mode === "create" ? "/api/users" : `/api/users/${userId}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const body =
      mode === "create"
        ? {
            ...formState,
            memberships: formState.memberships,
          }
        : {
            fullName: formState.fullName,
            username: formState.username,
            phone: formState.phone || null,
            isActive: formState.isActive,
            memberships: formState.memberships,
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
        : "Personnel mis à jour avec succès."
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
          <Link href="/users">Retour à la liste</Link>
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
              className="w-full border border-slate-300 px-3 py-2 bg-white"
              required
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Nom d'utilisateur</span>
            <input
              value={formState.username}
              onChange={event =>
                setFormState(current => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              className="w-full border border-slate-300 px-3 py-2 bg-white"
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
              className="w-full border border-slate-300 px-3 py-2 bg-white"
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
                className="w-full border border-slate-300 px-3 py-2 bg-white"
                minLength={6}
                required
              />
            </label>
          ) : null}

          <label className="flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm bg-white cursor-pointer select-none">
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

          <section className="space-y-6 border border-slate-300 bg-white p-6 md:col-span-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
                Rôles & Affectations aux Agences
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Gérez les liaisons de ce personnel avec les différentes agences et attribuez leurs rôles respectifs.
              </p>
            </div>

            <div className="space-y-6">
              {agencies.map(agency => {
                const isLinked = isMemberOf(agency.id);
                const agencyMembership = memberships.find(m => m.agencyId === agency.id);
                const agencyRoles = availableRoles.filter(r => r.agencyId === agency.id);

                return (
                  <div
                    key={agency.id}
                    className={`border p-4 transition-all rounded-lg ${
                      isLinked ? "border-teal-200 bg-teal-50/20" : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`agency-${agency.id}`}
                          checked={isLinked}
                          onChange={() => toggleMembership(agency.id)}
                          className="size-4 text-teal-600 accent-teal-600 cursor-pointer"
                        />
                        <label
                          htmlFor={`agency-${agency.id}`}
                          className="text-base font-bold text-slate-800 cursor-pointer hover:text-teal-700 select-none"
                        >
                          {agency.name} <span className="text-xs text-slate-500 font-normal">({agency.code})</span>
                        </label>
                      </div>
                      
                      {isLinked && (
                        <span className="inline-flex bg-teal-100 text-teal-800 text-xs px-2.5 py-1 font-semibold rounded-full border border-teal-200">
                          Membre actif
                        </span>
                      )}
                    </div>

                    {isLinked && (
                      <div className="mt-4 pt-4 border-t border-slate-200/60">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                          Sélectionnez les rôles pour {agency.name} :
                        </p>
                        
                        {agencyRoles.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">
                            Aucun rôle configuré pour cette agence.
                          </p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {agencyRoles.map(role => {
                              const hasRole = agencyMembership?.roleIds.includes(role.id) ?? false;
                              return (
                                <label
                                  key={role.id}
                                  className={`flex items-start gap-3 border p-3 hover:bg-slate-50 cursor-pointer rounded-lg transition-colors ${
                                    hasRole ? "border-teal-300 bg-white" : "border-slate-200 bg-white/60"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={hasRole}
                                    onChange={() => toggleRoleForAgency(agency.id, role.id)}
                                    className="mt-1 accent-teal-600"
                                  />
                                  <div>
                                    <span className="block font-semibold text-slate-800 text-sm">
                                      {role.name}
                                    </span>
                                    {role.description && (
                                      <span className="block text-slate-500 text-xs mt-0.5 leading-relaxed">
                                        {role.description}
                                      </span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting
                ? mode === "create"
                  ? "Création..."
                  : "Enregistrement..."
                : mode === "create"
                  ? "Créer le personnel"
                  : "Mettre à jour le personnel"}
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
