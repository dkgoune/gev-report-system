"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CriteriaList } from "./criteria-list";
import { impactLabel } from "./constants";
import type { CriterionItem } from "./types";

type CriteriaManagerProps = {
  initialCriteria: CriterionItem[];
};

export function CriteriaManager({ initialCriteria }: CriteriaManagerProps) {
  const [criteria, setCriteria] = useState<CriterionItem[]>(initialCriteria);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function loadCriteria() {
    const response = await fetch("/api/criteria", { method: "GET" });
    const payload = (await response.json().catch(() => null)) as {
      criteria?: CriterionItem[];
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de charger les critères.");
      setLoading(false);
      return;
    }

    setCriteria(payload?.criteria || []);
    setLoading(false);
  }

  const filteredCriteria = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return criteria;
    }

    return criteria.filter(criterion => {
      return (
        criterion.name.toLowerCase().includes(term) ||
        impactLabel(criterion.impact).toLowerCase().includes(term) ||
        criterion.weight.toLowerCase().includes(term) ||
        String(criterion.maxDaily ?? "illimite")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [criteria, search]);

  async function onToggleActive(criterion: CriterionItem) {
    setUpdatingId(criterion.id);

    const response = await fetch(`/api/criteria/${criterion.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !criterion.isActive }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de mettre à jour ce critère.");
      setUpdatingId(null);
      return;
    }

    toast.success(
      criterion.isActive ? "Critère désactivé." : "Critère activé."
    );
    setUpdatingId(null);
    setLoading(true);
    await loadCriteria();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Gestion des critères
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Créez, modifiez, activez ou désactivez les règles utilisées pour
            l'évaluation du personnel.
          </p>
        </div>

        <Button asChild>
          <Link href="/criteria/new">Ajouter un critère</Link>
        </Button>
      </div>

      <CriteriaList
        criteria={filteredCriteria}
        loading={loading}
        search={search}
        updatingId={updatingId}
        onSearchChange={setSearch}
        onToggleActive={onToggleActive}
      />
    </div>
  );
}
