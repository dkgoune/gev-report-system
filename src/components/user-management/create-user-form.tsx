import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { roleOptions } from "./constants";
import type { Role, UserFormState } from "./types";

type CreateUserFormProps = {
  formState: UserFormState;
  creating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (nextState: UserFormState) => void;
};

export function CreateUserForm({
  formState,
  creating,
  onSubmit,
  onChange,
}: CreateUserFormProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-lg font-semibold text-slate-900">
        Nouveau personnel
      </h3>
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Nom complet</span>
          <input
            value={formState.fullName}
            onChange={event =>
              onChange({
                ...formState,
                fullName: event.target.value,
              })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Nom utilisateur</span>
          <input
            value={formState.username}
            onChange={event =>
              onChange({
                ...formState,
                username: event.target.value,
              })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Rôle</span>
          <select
            value={formState.role}
            onChange={event =>
              onChange({
                ...formState,
                role: event.target.value as Role,
              })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {roleOptions.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Téléphone</span>
          <input
            value={formState.phone}
            onChange={event =>
              onChange({
                ...formState,
                phone: event.target.value,
              })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm ">
          <span className="font-medium text-slate-700">Mot de passe</span>
          <input
            type="password"
            value={formState.password}
            onChange={event =>
              onChange({
                ...formState,
                password: event.target.value,
              })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            minLength={6}
            required
          />
        </label>

        <label className="flex items-center gap-2 text-sm rounded-md border border-slate-300 px-3 py-2">
          <input
            type="checkbox"
            checked={formState.isActive}
            onChange={event =>
              onChange({
                ...formState,
                isActive: event.target.checked,
              })
            }
          />
          <span>Compte actif</span>
        </label>

        <div className="md:col-span-2">
          <Button type="submit" disabled={creating}>
            {creating ? "Création..." : "Ajouter le personnel"}
          </Button>
        </div>
      </form>
    </section>
  );
}
