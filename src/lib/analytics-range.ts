export type AnalyticsPreset =
  | "today"
  | "yesterday"
  | "last-7-days"
  | "last-30-days"
  | "this-month"
  | "last-month"
  | "custom";

export type AnalyticsRange = {
  from: string;
  fromDate: Date;
  label: string;
  preset: AnalyticsPreset;
  to: string;
  toDate: Date;
};

export const ANALYTICS_PRESETS: Array<{
  label: string;
  value: Exclude<AnalyticsPreset, "custom">;
}> = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "last-7-days", label: "7 derniers jours" },
  { value: "last-30-days", label: "30 derniers jours" },
  { value: "this-month", label: "Ce mois" },
  { value: "last-month", label: "Mois dernier" },
];

const DEFAULT_PRESET: AnalyticsPreset = "last-30-days";

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date) {
  return new Date(`${toDateOnly(date)}T00:00:00.000Z`);
}

function endOfUtcDay(date: Date) {
  return new Date(`${toDateOnly(date)}T23:59:59.999Z`);
}

function parseDateOnly(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPresetRange(preset: AnalyticsPreset, now = new Date()) {
  const today = startOfUtcDay(now);

  switch (preset) {
    case "today": {
      return {
        fromDate: today,
        toDate: endOfUtcDay(today),
        label: "Aujourd'hui",
      };
    }
    case "yesterday": {
      const fromDate = new Date(today);
      fromDate.setUTCDate(fromDate.getUTCDate() - 1);

      return {
        fromDate,
        toDate: endOfUtcDay(fromDate),
        label: "Hier",
      };
    }
    case "last-7-days": {
      const fromDate = new Date(today);
      fromDate.setUTCDate(fromDate.getUTCDate() - 6);

      return {
        fromDate,
        toDate: endOfUtcDay(today),
        label: "7 derniers jours",
      };
    }
    case "this-month": {
      const fromDate = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
      );

      return {
        fromDate,
        toDate: endOfUtcDay(today),
        label: "Ce mois",
      };
    }
    case "last-month": {
      const fromDate = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)
      );
      const toDate = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          0,
          23,
          59,
          59,
          999
        )
      );

      return {
        fromDate,
        toDate,
        label: "Mois dernier",
      };
    }
    case "custom":
    case "last-30-days":
    default: {
      const fromDate = new Date(today);
      fromDate.setUTCDate(fromDate.getUTCDate() - 29);

      return {
        fromDate,
        toDate: endOfUtcDay(today),
        label: "30 derniers jours",
      };
    }
  }
}

export function resolveAnalyticsRange(query: {
  from?: string;
  preset?: string;
  to?: string;
}) {
  const fromDate = parseDateOnly(query.from);
  const toDate = parseDateOnly(query.to);

  if (fromDate && toDate && fromDate <= toDate) {
    return {
      preset: "custom",
      from: toDateOnly(fromDate),
      to: toDateOnly(toDate),
      fromDate,
      toDate: endOfUtcDay(toDate),
      label: `${toDateOnly(fromDate)} au ${toDateOnly(toDate)}`,
    } satisfies AnalyticsRange;
  }

  const preset = ANALYTICS_PRESETS.some(item => item.value === query.preset)
    ? (query.preset as Exclude<AnalyticsPreset, "custom">)
    : DEFAULT_PRESET;

  const resolved = getPresetRange(preset);

  return {
    preset,
    from: toDateOnly(resolved.fromDate),
    to: toDateOnly(resolved.toDate),
    fromDate: resolved.fromDate,
    toDate: resolved.toDate,
    label: resolved.label,
  } satisfies AnalyticsRange;
}

export function formatRangeLabel(
  range: Pick<AnalyticsRange, "fromDate" | "toDate">
) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatRange(range.fromDate, range.toDate);
}

export function buildRangeSearchParams(range: {
  from?: string;
  preset?: string;
  to?: string;
}) {
  const params = new URLSearchParams();

  if (range.preset) {
    params.set("preset", range.preset);
  }

  if (range.from) {
    params.set("from", range.from);
  }

  if (range.to) {
    params.set("to", range.to);
  }

  return params;
}
