import { Crown, Shield } from "lucide-react";
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
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .print-badge {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              table, th, td, div, span, header, h1 {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `,
        }}
      />
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
        <table className="w-full border-collapse text-[10px] table-fixed">
          <thead className="bg-slate-100">
            <tr>
              <th className="w-22.5 border-b border-r border-slate-300 px-2 py-2 text-left font-bold uppercase tracking-wide text-slate-800 text-[10px]">
                Poste
              </th>
              {weekDays.map(day => (
                <th
                  key={day.dateKey}
                  className="border-b border-r border-slate-300 px-2 py-2 text-left font-bold uppercase tracking-wide text-slate-800 text-[10px] truncate"
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
                <td className="w-22.5 border-b border-r border-slate-200 px-2 py-2 font-semibold text-slate-900 text-[10px]">
                  {post.name}
                </td>
                {weekDays.map(day => {
                  const people = matrix[day.dateKey]?.[post.id] || [];

                  return (
                    <td
                      key={`${post.id}-${day.dateKey}`}
                      className="border-b border-r border-slate-200 p-1.5 min-w-0 overflow-hidden"
                    >
                      {people.length === 0 ? (
                        <span className="text-[10px] text-slate-400 block text-center">-</span>
                      ) : (
                        <div className="space-y-1 w-full min-w-0">
                          {people.map(person => (
                            <div
                              key={`${person.userId}-${day.dateKey}-${post.id}`}
                              className="flex items-center justify-between gap-1 text-[9px] font-medium leading-tight text-slate-700 w-full min-w-0"
                            >
                              <span className="truncate block min-w-0 flex-1" title={person.fullName}>
                                {person.fullName}
                              </span>
                              <span className="flex items-center gap-0.5 shrink-0">
                                {person.isLeader && <Crown className="size-2.5 text-amber-500 fill-amber-500" />}
                                {person.isSubleader && <Shield className="size-2.5 text-sky-600 fill-sky-200" />}
                              </span>
                            </div>
                          ))}
                        </div>
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
