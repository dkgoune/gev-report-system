"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
  IncidentBindingItem,
  IncidentServiceOption,
  IncidentTemplateOption,
} from "./types";

type IncidentBindingsManagerProps = {
  initialBindings: IncidentBindingItem[];
  initialServices: IncidentServiceOption[];
  initialTemplateOptions: IncidentTemplateOption[];
};

type BindingFormState = {
  id: string | null;
  serviceId: string;
  templateId: string;
  templateVersionId: string;
  minEntries: number;
  maxEntries: string;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
};

function hasDuplicateBinding(
  bindings: IncidentBindingItem[],
  target: {
    id?: string | null;
    serviceId: string;
    templateId: string;
  }
) {
  return bindings.some(binding => {
    if (target.id && binding.id === target.id) {
      return false;
    }

    return (
      binding.serviceId === target.serviceId &&
      binding.templateId === target.templateId
    );
  });
}

function createDefaultBindingFormState(
  services: IncidentServiceOption[],
  templateOptions: IncidentTemplateOption[]
): BindingFormState {
  const serviceId = services[0]?.id ?? "";
  const templateId = templateOptions[0]?.id ?? "";
  const templateVersionId = templateOptions[0]?.versions[0]?.id ?? "";

  return {
    id: null,
    serviceId,
    templateId,
    templateVersionId,
    minEntries: 0,
    maxEntries: "",
    isRequired: false,
    displayOrder: 0,
    isActive: true,
  };
}

export function IncidentBindingsManager({
  initialBindings,
  initialServices,
  initialTemplateOptions,
}: IncidentBindingsManagerProps) {
  const [bindings, setBindings] = useState(initialBindings);
  const [services, setServices] = useState(initialServices);
  const [templateOptions, setTemplateOptions] = useState(
    initialTemplateOptions
  );
  const [bindingForm, setBindingForm] = useState<BindingFormState>(() =>
    createDefaultBindingFormState(initialServices, initialTemplateOptions)
  );
  const [savingBinding, setSavingBinding] = useState(false);

  const sortedBindings = useMemo(() => {
    return [...bindings].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [bindings]);

  const selectedTemplateOption = useMemo(
    () =>
      templateOptions.find(option => option.id === bindingForm.templateId) ??
      null,
    [bindingForm.templateId, templateOptions]
  );

  async function reloadBindingsAndOptions() {
    const response = await fetch("/api/incidents/bindings", { method: "GET" });
    const payload = (await response.json().catch(() => null)) as {
      bindings?: IncidentBindingItem[];
      services?: IncidentServiceOption[];
      templateOptions?: IncidentTemplateOption[];
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de charger les liaisons.");
      return;
    }

    const nextServices = payload?.services ?? [];
    const nextTemplateOptions = payload?.templateOptions ?? [];

    setBindings(payload?.bindings ?? []);
    setServices(nextServices);
    setTemplateOptions(nextTemplateOptions);

    setBindingForm(current => {
      const nextTemplateId = nextTemplateOptions.some(
        option => option.id === current.templateId
      )
        ? current.templateId
        : (nextTemplateOptions[0]?.id ?? "");

      const candidateVersions =
        nextTemplateOptions.find(option => option.id === nextTemplateId)
          ?.versions ?? [];

      const nextVersionId = candidateVersions.some(
        version => version.id === current.templateVersionId
      )
        ? current.templateVersionId
        : (candidateVersions[0]?.id ?? "");

      const nextServiceId = nextServices.some(
        service => service.id === current.serviceId
      )
        ? current.serviceId
        : (nextServices[0]?.id ?? "");

      return {
        ...current,
        serviceId: nextServiceId,
        templateId: nextTemplateId,
        templateVersionId: nextVersionId,
      };
    });
  }

  function onBindingTemplateChange(templateId: string) {
    const versions =
      templateOptions.find(option => option.id === templateId)?.versions ?? [];

    setBindingForm(current => ({
      ...current,
      templateId,
      templateVersionId: versions[0]?.id ?? "",
    }));
  }

  function startBindingCreate() {
    setBindingForm(createDefaultBindingFormState(services, templateOptions));
  }

  function startBindingEdition(binding: IncidentBindingItem) {
    setBindingForm({
      id: binding.id,
      serviceId: binding.serviceId,
      templateId: binding.templateId,
      templateVersionId: binding.templateVersionId,
      minEntries: binding.minEntries,
      maxEntries: binding.maxEntries === null ? "" : String(binding.maxEntries),
      isRequired: binding.isRequired,
      displayOrder: binding.displayOrder,
      isActive: binding.isActive,
    });
  }

  async function onSubmitBinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      hasDuplicateBinding(bindings, {
        id: bindingForm.id,
        serviceId: bindingForm.serviceId,
        templateId: bindingForm.templateId,
      })
    ) {
      toast.error("Cette liaison service/modele existe deja.");
      return;
    }

    const selectedService =
      services.find(service => service.id === bindingForm.serviceId) ?? null;
    const selectedTemplate =
      templateOptions.find(
        template => template.id === bindingForm.templateId
      ) ?? null;
    const selectedVersion =
      selectedTemplate?.versions.find(
        version => version.id === bindingForm.templateVersionId
      ) ?? null;

    const optimisticBindingId = bindingForm.id ?? `temp-binding-${Date.now()}`;
    const optimisticBinding: IncidentBindingItem = {
      id: optimisticBindingId,
      serviceId: bindingForm.serviceId,
      serviceName: selectedService?.name ?? "Service",
      serviceCode: selectedService?.code ?? null,
      templateId: bindingForm.templateId,
      templateName: selectedTemplate?.name ?? "Modele",
      templateVersionId: bindingForm.templateVersionId,
      templateVersionNumber: selectedVersion?.version ?? 1,
      templateVersionStatus: selectedVersion?.status ?? "draft",
      templateVersionFields: [],
      minEntries: bindingForm.minEntries,
      maxEntries:
        bindingForm.maxEntries.trim() === ""
          ? null
          : Number(bindingForm.maxEntries),
      isRequired: bindingForm.isRequired,
      displayOrder: bindingForm.displayOrder,
      isActive: bindingForm.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const previousBindings = bindings;
    setBindings(current => {
      if (bindingForm.id) {
        return current.map(binding =>
          binding.id === bindingForm.id ? optimisticBinding : binding
        );
      }

      return [...current, optimisticBinding];
    });

    setSavingBinding(true);

    const method = bindingForm.id ? "PATCH" : "POST";
    const endpoint = bindingForm.id
      ? `/api/incidents/bindings/${bindingForm.id}`
      : "/api/incidents/bindings";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: bindingForm.serviceId,
        templateId: bindingForm.templateId,
        templateVersionId: bindingForm.templateVersionId,
        minEntries: bindingForm.minEntries,
        maxEntries:
          bindingForm.maxEntries.trim() === ""
            ? null
            : Number(bindingForm.maxEntries),
        isRequired: bindingForm.isRequired,
        displayOrder: bindingForm.displayOrder,
        isActive: bindingForm.isActive,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setBindings(previousBindings);
      toast.error(payload?.error || "Operation impossible.");
      setSavingBinding(false);
      return;
    }

    toast.success(bindingForm.id ? "Liaison mise a jour." : "Liaison creee.");
    setSavingBinding(false);
    startBindingCreate();
    await reloadBindingsAndOptions();
  }

  async function onDeleteBinding(bindingId: string) {
    const confirmed = window.confirm("Supprimer cette liaison d'incident ?");

    if (!confirmed) {
      return;
    }

    const previousBindings = bindings;
    setBindings(current => current.filter(binding => binding.id !== bindingId));

    const response = await fetch(`/api/incidents/bindings/${bindingId}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setBindings(previousBindings);
      toast.error(payload?.error || "Suppression impossible.");
      return;
    }

    toast.success("Liaison supprimee.");

    if (bindingForm.id === bindingId) {
      startBindingCreate();
    }

    await reloadBindingsAndOptions();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          Liaisons services et incidents
        </h2>
        <p className="text-sm text-slate-600">
          Associez chaque service aux modeles attendus et gerez les contraintes
          d'occurrence sur une page dediee.
        </p>
      </section>

      <section className="space-y-4 border border-slate-200 bg-white p-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Configuration de liaison
          </h3>
          <p className="text-sm text-slate-600">
            Definissez quels modeles d'incidents sont attendus par service.
          </p>
        </div>

        <form className="grid gap-3 md:grid-cols-3" onSubmit={onSubmitBinding}>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Service</span>
            <select
              value={bindingForm.serviceId}
              onChange={event =>
                setBindingForm(current => ({
                  ...current,
                  serviceId: event.target.value,
                }))
              }
              className="w-full border border-slate-300 bg-white px-3 py-2"
            >
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.code})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Modele</span>
            <select
              value={bindingForm.templateId}
              onChange={event => onBindingTemplateChange(event.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2"
            >
              {templateOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Version</span>
            <select
              value={bindingForm.templateVersionId}
              onChange={event =>
                setBindingForm(current => ({
                  ...current,
                  templateVersionId: event.target.value,
                }))
              }
              className="w-full border border-slate-300 bg-white px-3 py-2"
            >
              {(selectedTemplateOption?.versions ?? []).map(version => (
                <option key={version.id} value={version.id}>
                  v{version.version} ({version.status})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Min entrees</span>
            <input
              type="number"
              min={0}
              value={bindingForm.minEntries}
              onChange={event =>
                setBindingForm(current => ({
                  ...current,
                  minEntries: Number(event.target.value),
                }))
              }
              className="w-full border border-slate-300 bg-white px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Max entrees</span>
            <input
              type="number"
              min={0}
              value={bindingForm.maxEntries}
              onChange={event =>
                setBindingForm(current => ({
                  ...current,
                  maxEntries: event.target.value,
                }))
              }
              className="w-full border border-slate-300 bg-white px-3 py-2"
              placeholder="Vide = illimite"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Ordre</span>
            <input
              type="number"
              min={0}
              value={bindingForm.displayOrder}
              onChange={event =>
                setBindingForm(current => ({
                  ...current,
                  displayOrder: Number(event.target.value),
                }))
              }
              className="w-full border border-slate-300 bg-white px-3 py-2"
            />
          </label>

          <div className="md:col-span-3 flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={bindingForm.isRequired}
                onChange={event =>
                  setBindingForm(current => ({
                    ...current,
                    isRequired: event.target.checked,
                  }))
                }
              />
              Requis
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={bindingForm.isActive}
                onChange={event =>
                  setBindingForm(current => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Actif
            </label>
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={savingBinding}>
              {savingBinding
                ? "Enregistrement..."
                : bindingForm.id
                  ? "Mettre a jour la liaison"
                  : "Creer la liaison"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={startBindingCreate}
            >
              Nouvelle liaison
            </Button>
          </div>
        </form>
      </section>

      <section className="divide-y divide-slate-200 border border-slate-200 bg-white">
        {sortedBindings.length === 0 ? (
          <p className="px-4 py-4 text-sm text-slate-600">
            Aucune liaison definie.
          </p>
        ) : (
          sortedBindings.map(binding => (
            <div
              key={binding.id}
              className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {binding.serviceName} {"->"} {binding.templateName}
                </p>
                <p className="text-sm text-slate-600">
                  Version v{binding.templateVersionNumber} (
                  {binding.templateVersionStatus}) | Min: {binding.minEntries} |
                  Max: {binding.maxEntries ?? "illimite"} | Ordre:{" "}
                  {binding.displayOrder}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium ${
                    binding.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {binding.isActive ? "Active" : "Inactive"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startBindingEdition(binding)}
                >
                  Modifier
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteBinding(binding.id)}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
