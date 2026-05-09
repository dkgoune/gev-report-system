import type { Service } from "@/generated/prisma/enums";
import type { DailyReportFormState } from "./types";

export const dailyReportPageSizes = [10, 20, 50] as const;

export function createDefaultDailyReportState(
  reportDate: string,
  service: Service,
): DailyReportFormState {
  return {
    reportDate,
    service,
    personnelPresent: "",
    personnelAbsent: "",
    ambianceGenerale: "",
    problemesRencontres: "",
    etatGeneralService: "",
    passationService: "",
    observationGeneral: "",
  };
}

export const dailyReportFields: Array<{
  key:
    | "personnelPresent"
    | "personnelAbsent"
    | "ambianceGenerale"
    | "problemesRencontres"
    | "etatGeneralService"
    | "passationService"
    | "observationGeneral";
  label: string;
  placeholder: string;
}> = [
  {
    key: "personnelPresent",
    label: "État du personnel présent",
    placeholder: "Listez les agents présents et les faits marquants.",
  },
  {
    key: "personnelAbsent",
    label: "État du personnel absent",
    placeholder: "Indiquez les absences et leurs contextes si connus.",
  },
  {
    key: "ambianceGenerale",
    label: "Ambiance générale entre collègues",
    placeholder: "Décrivez le climat de travail du jour.",
  },
  {
    key: "problemesRencontres",
    label: "Problèmes rencontrés",
    placeholder: "Consignez les difficultés opérationnelles constatées.",
  },
  {
    key: "etatGeneralService",
    label: "État général du service",
    placeholder:
      "Précisez l'état du matériel, de la propreté et de l'organisation.",
  },
  {
    key: "passationService",
    label: "Passation de service",
    placeholder: "Notez les éléments transmis à l'équipe suivante.",
  },
  {
    key: "observationGeneral",
    label: "Observation général",
    placeholder: "Ajoutez toute observation ou suggestion complémentaire.",
  },
];
