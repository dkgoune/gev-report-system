type ReportIncidentEntry = {
  id: string;
  templateNameSnapshot: string;
  valuesJson: unknown;
  schemaSnapshotJson: unknown;
};

type ReportIncidentsSectionProps = {
  incidentEntries: ReportIncidentEntry[];
};

type IncidentFieldSchemaItem = {
  key: string;
  label: string;
};

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^./, char => char.toUpperCase());
}

function extractSchemaItems(
  schemaSnapshotJson: unknown
): IncidentFieldSchemaItem[] {
  if (!Array.isArray(schemaSnapshotJson)) {
    return [];
  }

  const items: IncidentFieldSchemaItem[] = [];

  for (const raw of schemaSnapshotJson) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }

    const key = typeof raw.key === "string" ? raw.key.trim() : "";
    const label = typeof raw.label === "string" ? raw.label.trim() : "";

    if (!key) {
      continue;
    }

    items.push({
      key,
      label: label || humanizeKey(key),
    });
  }

  return items;
}

function formatIncidentValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "Non renseigne";
  }

  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "Non renseigne";
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map(item => formatIncidentValue(item)).join(", ")
      : "Non renseigne";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildDisplayFields(entry: ReportIncidentEntry) {
  const values =
    entry.valuesJson &&
    typeof entry.valuesJson === "object" &&
    !Array.isArray(entry.valuesJson)
      ? (entry.valuesJson as Record<string, unknown>)
      : {};

  const schemaItems = extractSchemaItems(entry.schemaSnapshotJson);
  const schemaByKey = new Map(schemaItems.map(item => [item.key, item.label]));
  const orderedKeys = [
    ...schemaItems.map(item => item.key),
    ...Object.keys(values).filter(key => !schemaByKey.has(key)),
  ];

  return orderedKeys.map(key => ({
    key,
    label: schemaByKey.get(key) ?? humanizeKey(key),
    value: formatIncidentValue(values[key]),
  }));
}

export function ReportIncidentsSection({
  incidentEntries,
}: ReportIncidentsSectionProps) {
  const groupedEntries = incidentEntries.reduce(
    (acc, entry) => {
      const key = entry.templateNameSnapshot;
      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(entry);
      return acc;
    },
    {} as Record<string, ReportIncidentEntry[]>
  );

  return (
    <section className="space-y-4 border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Incidents liés</h2>
        <p className="text-sm text-slate-600">
          Incidents saisis selon les modèles configurés.
        </p>
      </div>

      {incidentEntries.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Aucun incident lié pour ce rapport.
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedEntries).map(([templateName, entries]) => (
            <div key={templateName} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {templateName}
              </h3>
              <div className="space-y-2">
                {entries.map((entry, index) => {
                  const fields = buildDisplayFields(entry);

                  return (
                    <article
                      key={entry.id}
                      className="space-y-3 border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Incident {index + 1}
                      </p>

                      {fields.length === 0 ? (
                        <p className="text-sm text-slate-600">Non renseigne.</p>
                      ) : (
                        <dl className="space-y-2">
                          {fields.map(field => (
                            <div
                              key={`${entry.id}-${field.key}`}
                              className="text-sm"
                            >
                              <dt className="inline font-semibold text-slate-900">
                                {field.label}:
                              </dt>{" "}
                              <dd className="inline whitespace-pre-wrap text-slate-700">
                                {field.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
