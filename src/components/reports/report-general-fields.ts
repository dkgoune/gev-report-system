export type ReportFieldDefinition = {
  key:
    | "ambianceGenerale"
    | "problemesRencontres"
    | "etatGeneralService"
    | "passationService"
    | "observationGeneral";
  label: string;
  placeholder: string;
};

export const GENERAL_REPORT_FIELDS: ReportFieldDefinition[] = [
  {
    key: "ambianceGenerale",
    label: "Ambiance générale",
    placeholder: "Décrivez l'ambiance générale du service.",
  },
  {
    key: "problemesRencontres",
    label: "Problèmes rencontrés",
    placeholder: "Listez les problèmes observés.",
  },
  {
    key: "etatGeneralService",
    label: "Etat général du service",
    placeholder: "Etat global du service pendant le shift.",
  },
  {
    key: "passationService",
    label: "Passation de service",
    placeholder: "Informations de passation entre équipes.",
  },
  {
    key: "observationGeneral",
    label: "Observation générale",
    placeholder: "Autres observations importantes.",
  },
];
