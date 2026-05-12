import type { ReportGroup } from "@/lib/report-records";
import type { ReportFieldDefinition } from "@/lib/report-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReportGeneralSectionProps = {
  fields: ReportFieldDefinition[];
  groups: ReportGroup[];
  groupId: string;
  isAdmin: boolean;
  reportDate: string;
  values: Record<string, string>;
  onGroupChange: (value: string) => void;
  onFieldChange: (fieldKey: string, value: string) => void;
  onDateChange: (value: string) => void;
};

export function ReportGeneralSection({
  fields,
  groups,
  groupId,
  isAdmin,
  reportDate,
  values,
  onGroupChange,
  onFieldChange,
  onDateChange,
}: ReportGeneralSectionProps) {
  return (
    <section className="space-y-5 border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Rapport général</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Commencez par le contexte global de la journée avant d'ajouter les
          incidents spécifiques.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Date du rapport</span>
          <input
            type="date"
            value={reportDate}
            onChange={event => onDateChange(event.target.value)}
            className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            required
          />
        </label>

        <div className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Groupe</span>
          {isAdmin ? (
            <Select value={groupId} onValueChange={onGroupChange}>
              <SelectTrigger className="h-11 w-full bg-white text-sm">
                <SelectValue placeholder="Choisir un groupe" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex h-11 items-center border border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-700">
              {groups.find(group => group.id === groupId)?.name ?? "Mon groupe"}
            </div>
          )}
        </div>

        {fields.map(field => (
          <label key={field.key} className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">{field.label}</span>
            <textarea
              value={values[field.key] ?? ""}
              onChange={event => onFieldChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="min-h-24 w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
