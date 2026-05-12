"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AttendanceStatus = "PRESENT" | "ABSENT";

type AttendanceCriterionOption = {
  id: string;
  name: string;
  impact: "POSITIVE" | "NEGATIVE";
  defaultWeight: string;
  maxDaily: number | null;
};

type AttendanceCriterionSettingItem = {
  id: string;
  status: AttendanceStatus;
  createdAt: string;
  criterion: AttendanceCriterionOption;
};

type AttendanceCriteriaSettingsProps = {
  initialCriteria: AttendanceCriterionOption[];
  initialSettings: AttendanceCriterionSettingItem[];
};

const statusOptions: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "PRESENT", label: "Présent" },
  { value: "ABSENT", label: "Absent" },
];

export function AttendanceCriteriaSettings({
  initialCriteria,
  initialSettings,
}: AttendanceCriteriaSettingsProps) {
  const [criteria] = useState(initialCriteria);
  const [settings, setSettings] = useState(initialSettings);
  const [criterionId, setCriterionId] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>("PRESENT");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const criterionOptions = useMemo(() => {
    return criteria.map(criterion => ({
      value: criterion.id,
      label: `${criterion.name} (${criterion.impact}, ${criterion.defaultWeight})`,
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
      body: JSON.stringify({ criterionId, status }),
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
    setStatus("PRESENT");
    setSubmitting(false);
    toast.success("Règle automatique enregistrée.");
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
          className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_220px_auto] md:items-end"
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
            <span className="font-medium text-slate-700">Appliquer à</span>
            <Select
              value={status}
              onValueChange={value => setStatus(value as AttendanceStatus)}
            >
              <SelectTrigger className="w-full bg-white text-sm">
                <SelectValue placeholder="Choisir un statut" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                Statut
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
                  colSpan={5}
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
                  {setting.status === "PRESENT" ? "Présent" : "Absent"}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {setting.criterion.defaultWeight}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {setting.criterion.maxDaily ?? "Illimité"}
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === setting.id}
                    onClick={() => void onDelete(setting.id)}
                  >
                    <Trash2 />
                    {deletingId === setting.id ? "Suppression..." : "Supprimer"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
