import type { WeeklyAssignmentsByDate, WorkSchedulePostOption } from "./types";

type PrintableWeekDay = {
  dateKey: string;
  dateLabel: string;
  label: string;
};

type WeeklyWorkSchedulePrintableProps = {
  agencyName: string;
  serviceName: string;
  weekDays: PrintableWeekDay[];
  posts: WorkSchedulePostOption[];
  matrix: WeeklyAssignmentsByDate;
};

export function WeeklyWorkSchedulePrintable({
  agencyName,
  serviceName,
  weekDays,
  posts,
  matrix,
}: WeeklyWorkSchedulePrintableProps) {
  return (
    <div className="bg-white p-8 text-slate-900">
      <header className="mb-6 border border-slate-200 bg-slate-50 p-5">
        <h1 className="text-2xl font-extrabold uppercase tracking-[0.12em] text-slate-800">
          Planning hebdomadaire
        </h1>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <p className="text-slate-700">
            <span className="font-semibold text-slate-900">Agence:</span>{" "}
            {agencyName}
          </p>
          <p className="text-slate-700">
            <span className="font-semibold text-slate-900">Service:</span>{" "}
            {serviceName}
          </p>
          <p className="text-slate-700">
            <span className="font-semibold text-slate-900">Debut:</span>{" "}
            {weekDays[0]?.dateLabel || "-"}
          </p>
          <p className="text-slate-700">
            <span className="font-semibold text-slate-900">Fin:</span>{" "}
            {weekDays[6]?.dateLabel || "-"}
          </p>
        </div>
      </header>

      <div className="overflow-hidden border border-slate-300">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-slate-100">
            <tr>
              <th className="w-48 border-b border-r border-slate-300 px-3 py-2.5 text-left font-bold uppercase tracking-wide text-slate-800">
                Poste
              </th>
              {weekDays.map(day => (
                <th
                  key={day.dateKey}
                  className="border-b border-slate-300 px-3 py-2.5 text-left font-bold uppercase tracking-wide text-slate-800"
                >
                  {day.label} {day.dateLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((post, postIndex) => (
              <tr
                key={post.id}
                className={`align-top ${postIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}
              >
                <td className="border-b border-r border-slate-200 px-3 py-2.5 font-semibold text-slate-900">
                  {post.name}
                </td>
                {weekDays.map(day => {
                  const people = matrix[day.dateKey]?.[post.id] || [];

                  return (
                    <td
                      key={`${post.id}-${day.dateKey}`}
                      className="border-b border-slate-200 px-3 py-2.5"
                    >
                      {people.length === 0 ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        <ul className="space-y-1 text-slate-800">
                          {people.map(person => (
                            <li
                              key={`${person.userId}-${day.dateKey}-${post.id}`}
                              className="leading-4"
                            >
                              {person.fullName}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
