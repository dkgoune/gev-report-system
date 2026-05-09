import type { Service } from "@/generated/prisma/enums";

export type DailyReportFormState = {
  reportDate: string;
  service: Service;
  personnelPresent: string;
  personnelAbsent: string;
  ambianceGenerale: string;
  problemesRencontres: string;
  etatGeneralService: string;
  passationService: string;
  observationGeneral: string;
};

export type DailyReportItem = {
  id: string;
  reportDate: string;
  service: Service;
  isRead: boolean;
  personnelPresent: string | null;
  personnelAbsent: string | null;
  ambianceGenerale: string | null;
  problemesRencontres: string | null;
  etatGeneralService: string | null;
  passationService: string | null;
  observationGeneral: string | null;
  createdAt: string;
  reportedBy: {
    id: string;
    fullName: string;
    username: string;
  };
};

export type DailyReportListFilters = {
  page: number;
  pageSize: number;
  search: string;
  service: string;
  isRead: string;
  startDate: string;
  endDate: string;
};
