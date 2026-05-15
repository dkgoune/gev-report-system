export interface ReportDTO {
  id: string;
  reportDate: string;
  isRead: boolean;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  serviceId: string;
  serviceName: string;
  workScheduleId: string;
  reportedBy: { fullName: string; username: string } | null;
  readBy: { fullName: string; username: string } | null;
  ambianceGenerale: string | null;
  problemesRencontres: string | null;
  etatGeneralService: string | null;
  passationService: string | null;
  observationGeneral: string | null;
  presentPersonnel: { id: string; fullName: string; username: string }[];
  absentPersonnel: { id: string; fullName: string; username: string }[];
  incidentEntries: {
    id: string;
    templateId: string;
    templateNameSnapshot: string;
    valuesJson: unknown;
  }[];
}
