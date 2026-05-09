import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Service } from "@/generated/prisma/enums";
import { DailyReportForm } from "@/components/daily-report-management/daily-report-form";
import {
  getServiceForRole,
  isValidService,
  serviceLabel,
} from "@/lib/services";
import { getServerSession } from "@/lib/session";

type CreateGeneralReportPageProps = {
  searchParams: Promise<{
    date?: string;
    service?: string;
  }>;
};

type DailyReportCurrentPayload = {
  selectedDate: string;
  selectedService: Service;
};

export default async function CreateGeneralReportPage({
  searchParams,
}: CreateGeneralReportPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const leaderService = getServiceForRole(session.role);
  const service =
    session.role === "admin"
      ? params.service && isValidService(params.service)
        ? params.service
        : "envoi"
      : leaderService;

  if (!service) {
    redirect("/");
  }

  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : new Date().toISOString().slice(0, 10);

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "http";

  if (!host) {
    throw new Error("Host header is required to fetch daily reports.");
  }

  const response = await fetch(
    `${protocol}://${host}/api/daily-reports?service=${service}&date=${date}`,
    {
      headers: {
        cookie: headerStore.get("cookie") || "",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Impossible de charger les rapports journaliers.");
  }

  const payload = (await response.json()) as DailyReportCurrentPayload;
  const isAdmin = session.role === "admin";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Ajouter un rapport général
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Saisissez un nouveau rapport général pour le service et la journée
            choisie.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Service :</span>{" "}
            {serviceLabel(payload.selectedService)}
          </p>
          <p>
            <span className="font-semibold">Date :</span> {payload.selectedDate}
          </p>
        </div>
      </div>

      <DailyReportForm
        key={`${payload.selectedDate}:${payload.selectedService}`}
        initialDate={payload.selectedDate}
        initialService={payload.selectedService}
        isAdmin={isAdmin}
      />
    </div>
  );
}
