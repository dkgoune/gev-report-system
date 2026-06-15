"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { IncidentTemplateItem } from "./types";
import type { FieldDraft, TemplateFormState } from "./incident-field-utils";
import {
  defaultFieldDraft,
  defaultTemplateFormState,
  hasDuplicateTemplateIdentity,
  mapDraftToField,
  mapFieldToDraft,
  normalizeKey,
} from "./incident-field-utils";
import { IncidentFieldDraftEditor } from "./incident-field-draft-editor";

type IncidentTemplateEditorProps = {
  mode: "create" | "edit";
  templates: IncidentTemplateItem[];
  template?: IncidentTemplateItem;
  posts?: Array<{ id: string; name: string; code: string }>;
};

export function IncidentTemplateEditor({
  mode,
  templates,
  template,
  posts = [],
}: IncidentTemplateEditorProps) {
  const router = useRouter();
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [localTemplate, setLocalTemplate] =
    useState<IncidentTemplateItem | null>(template ?? null);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(
    template
      ? {
          name: template.name,
          code: template.code,
          description: template.description ?? "",
          icon: template.icon ?? "",
          isActive: template.isActive,
          publishVersion: true,
          allowedPostIds: template.allowedPosts?.map(p => p.id) ?? [],
        }
      : defaultTemplateFormState
  );
  const [fieldDrafts, setFieldDrafts] = useState<FieldDraft[]>(() => {
    if (!template) {
      return [defaultFieldDraft];
    }

    const latestVersion = template.versions[0];
    return latestVersion?.fields.length
      ? latestVersion.fields.map(mapFieldToDraft)
      : [defaultFieldDraft];
  });

  const canSubmitCreate = mode === "create" && !savingTemplate;
  const canSubmitUpdate = mode === "edit" && !savingTemplate && !!localTemplate;
  const canSubmitVersion = mode === "edit" && !savingVersion && !!localTemplate;

  const pageTitle = mode === "create" ? "Nouveau modele" : "Modifier le modele";

  const historyTemplate = useMemo(() => {
    if (mode === "edit") {
      return localTemplate;
    }

    return null;
  }, [localTemplate, mode]);

  function updateFieldDraft(
    index: number,
    key: keyof FieldDraft,
    value: string | boolean
  ) {
    setFieldDrafts(current =>
      current.map((field, currentIndex) =>
        currentIndex === index ? { ...field, [key]: value } : field
      )
    );
  }

  function addFieldDraft() {
    setFieldDrafts(current => [...current, defaultFieldDraft]);
  }

  function removeFieldDraft(index: number) {
    setFieldDrafts(current =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  function validateBeforeSubmit(targetId?: string) {
    if (
      hasDuplicateTemplateIdentity(templates, {
        id: targetId,
        name: templateForm.name,
        code: templateForm.code,
      })
    ) {
      toast.error("Un modele avec ce nom ou ce code existe deja.");
      return false;
    }

    const normalizedKeys = fieldDrafts.map(field => normalizeKey(field.key));
    const uniqueKeys = new Set(normalizedKeys.filter(Boolean));
    if (uniqueKeys.size !== normalizedKeys.filter(Boolean).length) {
      toast.error("Les cles de champs doivent etre uniques.");
      return false;
    }

    return true;
  }

  async function onCreateTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateBeforeSubmit()) {
      return;
    }

    setSavingTemplate(true);

    const response = await fetch("/api/incidents/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...templateForm,
        fields: fieldDrafts.map(mapDraftToField),
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      template?: IncidentTemplateItem;
    } | null;

    if (!response.ok || !payload?.template) {
      toast.error(payload?.error || "Creation impossible.");
      setSavingTemplate(false);
      return;
    }

    toast.success("Modele cree.");
    router.push(`/reports/incidents/templates/${payload.template.id}`);
    router.refresh();
  }

  async function onUpdateTemplateMeta() {
    if (!localTemplate) {
      toast.error("Modele introuvable.");
      return;
    }

    if (!validateBeforeSubmit(localTemplate.id)) {
      return;
    }

    setSavingTemplate(true);

    const response = await fetch(
      `/api/incidents/templates/${localTemplate.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateForm.name,
          code: templateForm.code,
          description: templateForm.description,
          icon: templateForm.icon,
          isActive: templateForm.isActive,
          allowedPostIds: templateForm.allowedPostIds,
        }),
      }
    );

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Mise a jour impossible.");
      setSavingTemplate(false);
      return;
    }

    toast.success("Modele mis a jour.");
    setLocalTemplate(current =>
      current
        ? {
            ...current,
            name: templateForm.name.trim(),
            code: templateForm.code.trim(),
            description: templateForm.description.trim() || null,
            icon: templateForm.icon.trim() || null,
            isActive: templateForm.isActive,
            updatedAt: new Date().toISOString(),
            allowedPosts: posts.filter(p => templateForm.allowedPostIds.includes(p.id)),
          }
        : current
    );
    setSavingTemplate(false);
    router.refresh();
  }

  async function onPublishNewVersion() {
    if (!localTemplate) {
      toast.error("Modele introuvable.");
      return;
    }

    if (!validateBeforeSubmit(localTemplate.id)) {
      return;
    }

    setSavingVersion(true);

    const response = await fetch(
      `/api/incidents/templates/${localTemplate.id}/versions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fieldDrafts.map(mapDraftToField),
          publishVersion: templateForm.publishVersion,
        }),
      }
    );

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      version?: IncidentTemplateItem["versions"][number];
    } | null;

    if (!response.ok || !payload?.version) {
      toast.error(payload?.error || "Versionnement impossible.");
      setSavingVersion(false);
      return;
    }

    toast.success("Nouvelle version enregistree.");
    setLocalTemplate(current =>
      current
        ? {
            ...current,
            versions: [
              payload.version as IncidentTemplateItem["versions"][number],
              ...current.versions,
            ],
            updatedAt: new Date().toISOString(),
          }
        : current
    );
    setSavingVersion(false);
    router.refresh();
  }

  async function onDeleteTemplate() {
    if (!localTemplate) {
      return;
    }

    const confirmed = window.confirm(
      "Supprimer ce modele d'incident ? Cette action est irreversible."
    );
    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `/api/incidents/templates/${localTemplate.id}`,
      {
        method: "DELETE",
      }
    );

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Suppression impossible.");
      return;
    }

    toast.success("Modele supprime.");
    router.push("/reports/incidents/templates");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold text-slate-900">{pageTitle}</h2>
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/reports/incidents/templates">Retour a la liste</Link>
          </Button>
        </div>
        <p className="text-sm text-slate-600">
          Definissez les champs d'un modele d'incident puis publiez des
          versions.
        </p>
      </section>

      <section className="space-y-4 border border-slate-200 bg-white p-4">
        <form className="space-y-4" onSubmit={onCreateTemplate}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Nom</span>
              <input
                value={templateForm.name}
                onChange={event =>
                  setTemplateForm(current => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full border border-slate-300 bg-white px-3 py-2"
                required
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Code</span>
              <input
                value={templateForm.code}
                onChange={event =>
                  setTemplateForm(current => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                className="w-full border border-slate-300 bg-white px-3 py-2"
                placeholder="Ex: BAGAGE_PERDU"
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Description</span>
              <input
                value={templateForm.description}
                onChange={event =>
                  setTemplateForm(current => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="w-full border border-slate-300 bg-white px-3 py-2"
              />
            </label>

            {posts && posts.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Postes de travail autorisés à voir et déclarer cet incident
                </span>
                <p className="text-xs text-slate-500">
                  Si aucun poste n'est sélectionné, l'incident sera visible par tous les postes lors de la saisie d'un rapport.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 bg-slate-50 p-3 border border-slate-200">
                  {posts.map(post => {
                    const isChecked = templateForm.allowedPostIds.includes(post.id);
                    return (
                      <label
                        key={post.id}
                        className={`inline-flex items-center gap-2 text-sm p-2 border transition cursor-pointer select-none ${
                          isChecked
                            ? "bg-teal-50 border-teal-300 text-teal-900 font-medium"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={event => {
                            const checked = event.target.checked;
                            setTemplateForm(current => {
                              const allowedPostIds = checked
                                ? [...current.allowedPostIds, post.id]
                                : current.allowedPostIds.filter(id => id !== post.id);
                              return { ...current, allowedPostIds };
                            });
                          }}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span>
                          {post.name} <span className="text-xs text-slate-400">({post.code})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={templateForm.isActive}
                onChange={event =>
                  setTemplateForm(current => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Modele actif
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={templateForm.publishVersion}
                onChange={event =>
                  setTemplateForm(current => ({
                    ...current,
                    publishVersion: event.target.checked,
                  }))
                }
              />
              Publier la version
            </label>
          </div>

          <div className="space-y-3 border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">
                Champs de definition
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFieldDraft}
              >
                Ajouter un champ
              </Button>
            </div>

            <div className="space-y-3">
              {fieldDrafts.map((field, index) => (
                <IncidentFieldDraftEditor
                  key={index}
                  field={field}
                  index={index}
                  totalCount={fieldDrafts.length}
                  onUpdate={updateFieldDraft}
                  onRemove={removeFieldDraft}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mode === "create" ? (
              <Button type="submit" disabled={!canSubmitCreate}>
                {savingTemplate ? "Creation..." : "Creer le modele"}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canSubmitUpdate}
                  onClick={onUpdateTemplateMeta}
                >
                  {savingTemplate
                    ? "Enregistrement..."
                    : "Mettre a jour les meta"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canSubmitVersion}
                  onClick={onPublishNewVersion}
                >
                  {savingVersion
                    ? "Versionnement..."
                    : "Creer une nouvelle version"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDeleteTemplate}
                >
                  Supprimer
                </Button>
              </>
            )}
          </div>
        </form>
      </section>

      {historyTemplate ? (
        <section className="border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">
            Historique du modele selectionne
          </h4>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border border-slate-200 bg-white text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2">
                    Version
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2">
                    Statut
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2">
                    Champs
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2">
                    Cree le
                  </th>
                </tr>
              </thead>
              <tbody>
                {historyTemplate.versions.map(version => (
                  <tr key={version.id}>
                    <td className="border-b border-slate-200 px-3 py-2">
                      v{version.version}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2">
                      {version.status}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2">
                      {version.fields.length}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2">
                      {new Date(version.createdAt).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
