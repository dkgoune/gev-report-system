import type { MembershipRole } from "@/generated/prisma/enums";

type PersonnelOption = {
  id: string;
  fullName: string;
  role: MembershipRole;
  username: string;
};

type ReportAttendanceSectionProps = {
  presentIds: string[];
  personnel: PersonnelOption[];
  onTogglePresent: (userId: string, checked: boolean) => void;
};

export function ReportAttendanceSection({
  presentIds,
  personnel,
  onTogglePresent,
}: ReportAttendanceSectionProps) {
  return (
    <section className="space-y-5 border border-slate-200 bg-slate-50 p-5">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          Présence du personnel
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Tous les personnels sont considérés présents par défaut. Décochez un
          membre pour le marquer absent dans le rapport.
        </p>
      </div>

      <AttendanceGrid
        description="Case cochée = présent. Case décochée = absent."
        emptyLabel="Aucun personnel disponible pour ce service."
        personnel={personnel}
        presentIds={presentIds}
        onToggle={onTogglePresent}
      />
    </section>
  );
}

function AttendanceGrid({
  description,
  emptyLabel,
  personnel,
  presentIds,
  onToggle,
}: {
  description: string;
  emptyLabel: string;
  personnel: PersonnelOption[];
  presentIds: string[];
  onToggle: (userId: string, checked: boolean) => void;
}) {
  return (
    <article className="space-y-4 border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">
          Personnel du service
        </h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      {personnel.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {personnel.map(user => {
            const checked = presentIds.includes(user.id);

            return (
              <label
                key={user.id}
                className={`flex items-start gap-3 border px-3 py-3 text-sm transition ${
                  checked
                    ? "border-emerald-300 bg-emerald-50 shadow-sm"
                    : "border-rose-200 bg-rose-50 hover:border-rose-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={event => onToggle(user.id, event.target.checked)}
                  className="mt-0.5 size-4 border-slate-300"
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-sm text-slate-900">
                    {user.fullName}
                  </span>
                  <span className="block text-xs uppercase tracking-wide text-slate-500">
                    {user.role}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </article>
  );
}
