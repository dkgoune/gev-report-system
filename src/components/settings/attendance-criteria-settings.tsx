"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AttendanceCriterionOption = {
  id: string;
  name: string;
  impact: "high" | "low";
  weight: string;
  maxDaily: number | null;
};

type AttendanceCriterionSettingItem = {
  id: string;
  isEnabled: boolean;
  appliesTo: "present" | "absent" | "both";
  createdAt: string;
  criterion: AttendanceCriterionOption;
};

type AttendanceCriteriaSettingsProps = {
  initialCriteria: AttendanceCriterionOption[];
  initialSettings: AttendanceCriterionSettingItem[];
};

function impactLabel(impact: AttendanceCriterionOption["impact"]) {
  return impact === "high" ? "Positif" : "Négatif";
}

export function AttendanceCriteriaSettings({
  initialCriteria,
  initialSettings,
}: AttendanceCriteriaSettingsProps) {
  const [criteria] = useState(initialCriteria);
  const [settings, setSettings] = useState(initialSettings);
  const [criterionId, setCriterionId] = useState("");
  const [appliesTo, setAppliesTo] = useState<"present" | "absent" | "both">(
    "present"
  );
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const criterionOptions = useMemo(() => {
    return criteria.map(criterion => ({
      value: criterion.id,
      label: `${criterion.name} (${impactLabel(criterion.impact)}, ${criterion.weight})`,
      keywords: [criterion.name, criterion.impact],
    }));
  }, [criteria]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!criterionId) {
      toast.error("Choisissez un critère avant d'ajouter une règle.");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/settings/attendance-criteria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ criterionId, appliesTo }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      setting?: AttendanceCriterionSettingItem;
    } | null;

    if (!response.ok || !payload?.setting) {
      toast.error(payload?.error || "Impossible d'ajouter cette règle.");
      setSubmitting(false);
      return;
    }

    setSettings(current => [
      payload.setting as AttendanceCriterionSettingItem,
      ...current,
    ]);
    setCriterionId("");
    setAppliesTo("present");
    setSubmitting(false);
    toast.success("Règle automatique enregistrée.");
  }

  async function onToggleEnabled(setting: AttendanceCriterionSettingItem) {
    setUpdatingId(setting.id);

    const response = await fetch(
      `/api/settings/attendance-criteria/${setting.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !setting.isEnabled }),
      }
    );

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      setting?: AttendanceCriterionSettingItem;
    } | null;

    if (!response.ok || !payload?.setting) {
      toast.error(payload?.error || "Impossible de mettre à jour cette règle.");
      setUpdatingId(null);
      return;
    }

    setSettings(current =>
      current.map(item => (item.id === setting.id ? payload.setting! : item))
    );
    setUpdatingId(null);
    toast.success(
      payload.setting.isEnabled ? "Règle activée." : "Règle désactivée."
    );
  }

  async function onDelete(id: string) {
    setDeletingId(id);

    const response = await fetch(`/api/settings/attendance-criteria/${id}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de supprimer cette règle.");
      setDeletingId(null);
      return;
    }

    setSettings(current => current.filter(setting => setting.id !== id));
    setDeletingId(null);
    toast.success("Règle supprimée.");
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Paramètres de présence/absence
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Définissez quels critères doivent être appliqués automatiquement aux
          personnels présents ou absents lors de l'enregistrement d'un rapport
          général.
        </p>
      </div>

      <section className="border border-slate-200 bg-slate-50 p-4">
        <form
          className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] md:items-end"
          onSubmit={onSubmit}
        >
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Critère</span>
            <SearchableSelect
              value={criterionId}
              onValueChange={setCriterionId}
              options={criterionOptions}
              placeholder="Choisir un critère"
              searchPlaceholder="Rechercher un critère"
              emptyMessage="Aucun critère disponible."
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">S'applique à</span>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={appliesTo}
              onChange={e =>
                setAppliesTo(e.target.value as "present" | "absent" | "both")
              }
            >
              <option value="present">Présents</option>
              <option value="absent">Absents</option>
              <option value="both">Les deux</option>
            </select>
          </label>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Ajout..." : "Ajouter la règle"}
          </Button>
        </form>
      </section>

      <section className="overflow-hidden border border-slate-200 bg-white">
        <Table className="min-w-full divide-y divide-slate-200 text-sm">
          <TableHeader className="bg-slate-50 text-left text-slate-700">
            <TableRow>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Critère
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                S'applique à
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                État
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Poids
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Max / jour
              </TableHead>
              <TableHead className="px-4 py-3 font-medium whitespace-nowrap">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200">
            {settings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-600"
                >
                  Aucune règle automatique configurée.
                </TableCell>
              </TableRow>
            ) : null}

            {settings.map(setting => (
              <TableRow key={setting.id}>
                <TableCell className="px-4 py-3 text-slate-900 whitespace-nowrap">
                  {setting.criterion.name}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      setting.appliesTo === "present"
                        ? "bg-emerald-100 text-emerald-700"
                        : setting.appliesTo === "absent"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {setting.appliesTo === "present"
                      ? "Présents"
                      : setting.appliesTo === "absent"
                        ? "Absents"
                        : "Les deux"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      setting.isEnabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {setting.isEnabled ? "Actif" : "Inactif"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {setting.criterion.weight}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {setting.criterion.maxDaily ?? "Illimité"}
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={updatingId === setting.id}
                      onClick={() => void onToggleEnabled(setting)}
                    >
                      <Power />
                      {updatingId === setting.id
                        ? "Mise a jour..."
                        : setting.isEnabled
                          ? "Désactiver"
                          : "Activer"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deletingId === setting.id}
                      onClick={() => void onDelete(setting.id)}
                    >
                      <Trash2 />
                      {deletingId === setting.id
                        ? "Suppression..."
                        : "Supprimer"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
