"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type IncidentsManagerProps = {
  templateCount: number;
  activeTemplateCount: number;
  bindingCount: number;
  activeBindingCount: number;
  serviceCount: number;
};

const CARDS = [
  {
    href: "/reports/incidents/templates",
    title: "Modeles d'incidents",
    description:
      "Definissez les modeles, leurs champs et les versions publiees sur un espace dedie.",
  },
  {
    href: "/reports/incidents/bindings",
    title: "Liaisons par service",
    description:
      "Associez les modeles aux services et reglez les contraintes d'occurrence sans bruit supplementaire.",
  },
];

export function IncidentsManager({
  templateCount,
  activeTemplateCount,
  bindingCount,
  activeBindingCount,
  serviceCount,
}: IncidentsManagerProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          Administration des incidents
        </h2>
        <p className="text-sm text-slate-600">
          L'administration des incidents a ete separee en deux parcours plus
          courts: definition des modeles et liaisons par service.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Modeles</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {templateCount}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {activeTemplateCount} actifs
          </p>
        </div>
        <div className="border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Liaisons</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {bindingCount}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {activeBindingCount} actives
          </p>
        </div>
        <div className="border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Services couverts</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {serviceCount}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            services actifs dans l'agence
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {CARDS.map(card => (
          <article
            key={card.href}
            className="border border-slate-200 bg-white p-5"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {card.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            <Button asChild className="mt-4">
              <Link href={card.href}>Ouvrir</Link>
            </Button>
          </article>
        ))}
      </section>
    </div>
  );
}
