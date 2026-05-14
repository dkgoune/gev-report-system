import type { ReportFieldDefinition } from "./report-general-fields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WorkScheduleOption = {
  id: string;
  workDate: string;
  serviceId: string;
  serviceName: string;
};

type ReportGeneralSectionProps = {
  fields: ReportFieldDefinition[];
  schedules: WorkScheduleOption[];
  workScheduleId: string;
  values: Record<string, string>;
  onWorkScheduleChange: (value: string) => void;
  onFieldChange: (fieldKey: string, value: string) => void;
};

export function ReportGeneralSection({
  fields,
  schedules,
  workScheduleId,
  values,
  onWorkScheduleChange,
  onFieldChange,
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
        <div className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Planning</span>
          <Select value={workScheduleId} onValueChange={onWorkScheduleChange}>
            <SelectTrigger className="h-11 w-full bg-white text-sm">
              <SelectValue placeholder="Choisir un planning" />
            </SelectTrigger>
            <SelectContent>
              {schedules.map(schedule => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {new Date(schedule.workDate).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  {"-"} {schedule.serviceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
