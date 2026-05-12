import type { Role, Service } from "@/generated/prisma/enums";

export type ReportTypeSlug =
  | "general"
  | "colis-non-vus"
  | "colis-hors-bordereaux"
  | "erreurs-destination"
  | "colis-retardes"
  | "colis-non-identifies"
  | "colis-transferes"
  | "convoyeurs-absents"
  | "bordereaux-non-conformes"
  | "vehicules-embarques";

export type ReportFieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "time";

export type ReportFieldDefinition = {
  key: string;
  label: string;
  placeholder?: string;
  type: ReportFieldType;
};

export type ReportTypeDefinition = {
  slug: ReportTypeSlug;
  title: string;
  singularTitle: string;
  description: string;
  createDescription: string;
  detailDescription: string;
  listPath: `/reports/${string}`;
  newPath: `/reports/${string}/new`;
  model: string;
  allowedServices: Service[];
  serviceField: boolean;
  fields: ReportFieldDefinition[];
  searchFields: string[];
  summaryFields: string[];
};

const PLATFORM_REPORT_ROLES: Role[] = ["admin", "leader", "subleader"];

function buildDefinition(
  definition: Omit<ReportTypeDefinition, "listPath" | "newPath">
): ReportTypeDefinition {
  return {
    ...definition,
    listPath: `/reports/${definition.slug}`,
    newPath: `/reports/${definition.slug}/new`,
  };
}

export const REPORT_PAGE_SIZES = [10, 20, 50] as const;

export const REPORT_TYPES = [
  buildDefinition({
    slug: "general",
    title: "Rapports généraux",
    singularTitle: "rapport général",
    description: "Vue consolidée des rapports généraux journaliers.",
    createDescription:
      "Saisissez le rapport général du jour et ajoutez directement les sous-rapports du service dans le même formulaire.",
    detailDescription:
      "Consultez le détail du rapport journalier et marquez-le comme lu si nécessaire.",
    model: "dailyGeneralReport",
    allowedServices: ["envoi", "piste", "retrait"],
    serviceField: true,
    searchFields: [
      "personnelPresent",
      "personnelAbsent",
      "ambianceGenerale",
      "problemesRencontres",
      "etatGeneralService",
      "passationService",
      "observationGeneral",
    ],
    summaryFields: [
      "problemesRencontres",
      "observationGeneral",
      "ambianceGenerale",
    ],
    fields: [
      {
        key: "personnelPresent",
        label: "Personnel présent",
        placeholder: "Sélectionnez les personnels présents.",
        type: "textarea",
      },
      {
        key: "personnelAbsent",
        label: "Personnel absent",
        placeholder: "Sélectionnez les personnels absents.",
        type: "textarea",
      },
      {
        key: "ambianceGenerale",
        label: "Ambiance générale",
        placeholder: "Décrivez brièvement le climat de travail du jour.",
        type: "textarea",
      },
      {
        key: "problemesRencontres",
        label: "Incidents et problèmes",
        placeholder: "Notez seulement les points bloquants ou sensibles.",
        type: "textarea",
      },
      {
        key: "etatGeneralService",
        label: "État du service",
        placeholder:
          "Résumez l'état du matériel, de l'organisation et de la propreté.",
        type: "textarea",
      },
      {
        key: "passationService",
        label: "Passation de service",
        placeholder: "Notez ce qui doit être transmis à l'équipe suivante.",
        type: "textarea",
      },
      {
        key: "observationGeneral",
        label: "Observation finale",
        placeholder: "Ajoutez un complément utile seulement si nécessaire.",
        type: "textarea",
      },
    ],
  }),
  buildDefinition({
    slug: "colis-non-vus",
    title: "Colis non vus",
    singularTitle: "rapport de colis non vus",
    description: "Liste des colis non vus ou introuvables.",
    createDescription:
      "Déclarez un colis non vu avec les informations opérationnelles disponibles.",
    detailDescription: "Consultez le détail du signalement de colis non vu.",
    model: "colisNonVu",
    allowedServices: ["envoi", "piste"],
    serviceField: true,
    searchFields: [
      "immatriculation",
      "agenceDepart",
      "description",
      "destinataire",
      "destinatairePhone",
      "actionEnCours",
    ],
    summaryFields: ["description", "actionEnCours", "destinataire"],
    fields: [
      {
        key: "immatriculation",
        label: "Immatriculation",
        placeholder: "Ex. AB-123-CD",
        type: "text",
      },
      {
        key: "agenceDepart",
        label: "Agence départ",
        placeholder: "Agence de départ du colis",
        type: "text",
      },
      {
        key: "description",
        label: "Description",
        placeholder: "Décrivez le colis ou l'incident constaté.",
        type: "textarea",
      },
      {
        key: "destinataire",
        label: "Destinataire",
        placeholder: "Nom du destinataire",
        type: "text",
      },
      {
        key: "destinatairePhone",
        label: "N° de téléphone",
        placeholder: "Numéro du destinataire",
        type: "text",
      },
      {
        key: "actionEnCours",
        label: "Action en cours",
        placeholder: "Décrivez l'action actuellement engagée.",
        type: "textarea",
      },
    ],
  }),
  buildDefinition({
    slug: "colis-hors-bordereaux",
    title: "Colis hors bordereaux",
    singularTitle: "rapport de colis hors bordereau",
    description: "Liste des colis signalés hors bordereau.",
    createDescription:
      "Déclarez un colis hors bordereau avec les éléments disponibles.",
    detailDescription:
      "Consultez le détail du signalement de colis hors bordereau.",
    model: "colisHorsBordereau",
    allowedServices: ["envoi", "retrait"],
    serviceField: false,
    searchFields: [
      "agenceDepart",
      "description",
      "destinataire",
      "destinatairePhone",
      "actionMenee",
    ],
    summaryFields: ["description", "actionMenee", "destinataire"],
    fields: [
      {
        key: "agenceDepart",
        label: "Agence départ",
        placeholder: "Agence concernée",
        type: "text",
      },
      {
        key: "description",
        label: "Description",
        placeholder: "Décrivez le colis et le contexte.",
        type: "textarea",
      },
      {
        key: "destinataire",
        label: "Destinataire",
        placeholder: "Nom du destinataire",
        type: "text",
      },
      {
        key: "destinatairePhone",
        label: "N° de téléphone",
        placeholder: "Numéro du destinataire",
        type: "text",
      },
      {
        key: "actionMenee",
        label: "Action menée",
        placeholder: "Décrivez les actions déjà effectuées.",
        type: "textarea",
      },
    ],
  }),
  buildDefinition({
    slug: "erreurs-destination",
    title: "Erreurs de destination",
    singularTitle: "rapport d'erreur de destination",
    description: "Liste des erreurs de destination constatées.",
    createDescription:
      "Déclarez une erreur de destination avec ses impacts et corrections.",
    detailDescription:
      "Consultez le détail du signalement d'erreur de destination.",
    model: "erreurDestination",
    allowedServices: ["envoi", "piste", "retrait"],
    serviceField: false,
    searchFields: [
      "immatriculation",
      "destination",
      "description",
      "destinationPrevue",
      "destinationErronee",
      "destinataire",
      "destinatairePhone",
      "equipeFacturation",
    ],
    summaryFields: ["description", "destinationErronee", "destinataire"],
    fields: [
      {
        key: "immatriculation",
        label: "Immatriculation",
        placeholder: "Véhicule ou support concerné",
        type: "text",
      },
      {
        key: "destination",
        label: "Destination",
        placeholder: "Destination inscrite",
        type: "text",
      },
      {
        key: "description",
        label: "Description",
        placeholder: "Décrivez l'erreur constatée.",
        type: "textarea",
      },
      {
        key: "destinationPrevue",
        label: "Destination prévue",
        placeholder: "Destination attendue",
        type: "text",
      },
      {
        key: "destinationErronee",
        label: "Destination erronée",
        placeholder: "Destination réellement indiquée",
        type: "text",
      },
      {
        key: "destinataire",
        label: "Destinataire",
        placeholder: "Nom du destinataire",
        type: "text",
      },
      {
        key: "destinatairePhone",
        label: "N° de téléphone",
        placeholder: "Numéro du destinataire",
        type: "text",
      },
      {
        key: "equipeFacturation",
        label: "Équipe de facturation",
        placeholder: "Équipe impliquée si applicable",
        type: "text",
      },
    ],
  }),
  buildDefinition({
    slug: "colis-retardes",
    title: "Colis retardés",
    singularTitle: "rapport de colis retardé",
    description: "Liste des colis retardés.",
    createDescription: "Déclarez un colis retardé et les actions engagées.",
    detailDescription: "Consultez le détail du signalement de colis retardé.",
    model: "colisRetarde",
    allowedServices: ["piste"],
    serviceField: false,
    searchFields: [
      "codeColis",
      "description",
      "destinataire",
      "motifRetard",
      "actionEnCours",
    ],
    summaryFields: ["motifRetard", "description", "actionEnCours"],
    fields: [
      {
        key: "codeColis",
        label: "Code colis",
        placeholder: "Référence du colis",
        type: "text",
      },
      {
        key: "description",
        label: "Description",
        placeholder: "Décrivez le colis ou le blocage.",
        type: "textarea",
      },
      {
        key: "destinataire",
        label: "Destinataire",
        placeholder: "Nom du destinataire",
        type: "text",
      },
      {
        key: "motifRetard",
        label: "Motif du retard",
        placeholder: "Expliquez l'origine du retard.",
        type: "textarea",
      },
      {
        key: "actionEnCours",
        label: "Action en cours",
        placeholder: "Décrivez l'action actuellement engagée.",
        type: "textarea",
      },
    ],
  }),
  buildDefinition({
    slug: "colis-non-identifies",
    title: "Colis non identifiés",
    singularTitle: "rapport de colis non identifié",
    description: "Liste des colis non identifiés.",
    createDescription:
      "Déclarez un colis non identifié avec son état et les actions engagées.",
    detailDescription:
      "Consultez le détail du signalement de colis non identifié.",
    model: "colisNonIdentifie",
    allowedServices: ["piste"],
    serviceField: false,
    searchFields: ["descriptionColis", "motifNonIdentification", "actionMenee"],
    summaryFields: [
      "motifNonIdentification",
      "descriptionColis",
      "actionMenee",
    ],
    fields: [
      {
        key: "descriptionColis",
        label: "Description du colis",
        placeholder: "Décrivez le colis non identifié.",
        type: "textarea",
      },
      {
        key: "motifNonIdentification",
        label: "Motif de non identification",
        placeholder: "Expliquez pourquoi l'identification n'est pas possible.",
        type: "textarea",
      },
      {
        key: "actionMenee",
        label: "Action menée",
        placeholder: "Décrivez les actions déjà réalisées.",
        type: "textarea",
      },
    ],
  }),
  buildDefinition({
    slug: "colis-transferes",
    title: "Colis transférés",
    singularTitle: "rapport de colis transféré",
    description: "Liste des colis transférés.",
    createDescription:
      "Déclarez un transfert de colis avec les informations de bordereau.",
    detailDescription: "Consultez le détail du signalement de colis transféré.",
    model: "colisTransfere",
    allowedServices: ["piste"],
    serviceField: false,
    searchFields: ["destination", "numeroBordereau", "chauffeur", "statut"],
    summaryFields: ["statut", "destination", "numeroBordereau"],
    fields: [
      {
        key: "destination",
        label: "Destination",
        placeholder: "Destination du transfert",
        type: "text",
      },
      {
        key: "numeroBordereau",
        label: "Numéro de bordereau",
        placeholder: "Référence du bordereau",
        type: "text",
      },
      {
        key: "nombreColis",
        label: "Nombre de colis",
        placeholder: "Nombre de colis transférés",
        type: "number",
      },
      {
        key: "chauffeur",
        label: "Chauffeur",
        placeholder: "Nom du chauffeur",
        type: "text",
      },
      {
        key: "statut",
        label: "Statut",
        placeholder: "Statut du transfert",
        type: "text",
      },
    ],
  }),
  buildDefinition({
    slug: "convoyeurs-absents",
    title: "Convoyeurs absents",
    singularTitle: "rapport de convoyeur absent",
    description: "Liste des convoyeurs absents.",
    createDescription:
      "Déclarez l'absence d'un convoyeur avec les références utiles.",
    detailDescription:
      "Consultez le détail du signalement de convoyeur absent.",
    model: "convoyeurAbsent",
    allowedServices: ["envoi"],
    serviceField: false,
    searchFields: ["nom", "numero", "vehicule", "agenceProvenance"],
    summaryFields: ["nom", "vehicule", "agenceProvenance"],
    fields: [
      {
        key: "nom",
        label: "Nom",
        placeholder: "Nom du convoyeur",
        type: "text",
      },
      {
        key: "numero",
        label: "Numéro",
        placeholder: "Numéro ou identifiant",
        type: "text",
      },
      {
        key: "vehicule",
        label: "Véhicule",
        placeholder: "Véhicule concerné",
        type: "text",
      },
      {
        key: "agenceProvenance",
        label: "Agence de provenance",
        placeholder: "Agence de provenance du convoyeur",
        type: "text",
      },
    ],
  }),
  buildDefinition({
    slug: "bordereaux-non-conformes",
    title: "Bordereaux non conformes",
    singularTitle: "rapport de bordereau non conforme",
    description: "Liste des bordereaux non conformes.",
    createDescription:
      "Déclarez un bordereau non conforme et les actions menées.",
    detailDescription:
      "Consultez le détail du signalement de bordereau non conforme.",
    model: "bordereauNonConforme",
    allowedServices: ["envoi"],
    serviceField: false,
    searchFields: ["numeroBordereau", "motifNonConformite", "actionMenee"],
    summaryFields: ["motifNonConformite", "actionMenee", "numeroBordereau"],
    fields: [
      {
        key: "numeroBordereau",
        label: "Numéro de bordereau",
        placeholder: "Référence du bordereau",
        type: "text",
      },
      {
        key: "motifNonConformite",
        label: "Motif de non-conformité",
        placeholder: "Décrivez la non-conformité constatée.",
        type: "textarea",
      },
      {
        key: "actionMenee",
        label: "Action menée",
        placeholder: "Décrivez les actions correctives déjà lancées.",
        type: "textarea",
      },
    ],
  }),
  buildDefinition({
    slug: "vehicules-embarques",
    title: "Véhicules embarqués",
    singularTitle: "rapport de véhicule embarqué",
    description: "Liste des véhicules embarqués.",
    createDescription:
      "Déclarez un véhicule embarqué avec l'heure et le contexte de chargement.",
    detailDescription:
      "Consultez le détail du signalement de véhicule embarqué.",
    model: "vehiculeEmbarque",
    allowedServices: ["piste"],
    serviceField: false,
    searchFields: [
      "immatriculation",
      "destination",
      "retourReceptionColis",
      "presenceConvoyeurs",
    ],
    summaryFields: [
      "retourReceptionColis",
      "presenceConvoyeurs",
      "destination",
    ],
    fields: [
      {
        key: "immatriculation",
        label: "Immatriculation",
        placeholder: "Plaque du véhicule",
        type: "text",
      },
      {
        key: "destination",
        label: "Destination",
        placeholder: "Destination du véhicule",
        type: "text",
      },
      {
        key: "heure",
        label: "Heure",
        type: "time",
      },
      {
        key: "retourReceptionColis",
        label: "Retour de réception des colis",
        placeholder: "Précisez le retour ou la réception des colis.",
        type: "textarea",
      },
      {
        key: "presenceConvoyeurs",
        label: "Présence de convoyeurs",
        placeholder: "Décrivez la présence ou l'absence des convoyeurs.",
        type: "textarea",
      },
    ],
  }),
] as const satisfies readonly ReportTypeDefinition[];

export function getReportType(slug: string): ReportTypeDefinition | null {
  return REPORT_TYPES.find(reportType => reportType.slug === slug) ?? null;
}

export function getReportTypesForRole(
  role: Role,
  groupService: Service | null = null
): ReportTypeDefinition[] {
  if (role === "admin") {
    return [...REPORT_TYPES];
  }

  const roleService = getServiceForRole(role, groupService);

  if (!roleService) {
    return [];
  }

  return REPORT_TYPES.filter(reportType =>
    reportType.allowedServices.includes(roleService)
  );
}

export function getReportTypeOptionsForRole(
  role: Role,
  groupService: Service | null = null
) {
  return getReportTypesForRole(role, groupService).map(reportType => ({
    slug: reportType.slug,
    title: reportType.title,
    description: reportType.description,
    newPath: reportType.newPath,
    listPath: reportType.listPath,
  }));
}

export function canAccessReportType(
  role: Role,
  reportType: ReportTypeDefinition,
  groupService: Service | null = null
) {
  if (role === "admin") {
    return true;
  }

  const roleService = getServiceForRole(role, groupService);
  return roleService ? reportType.allowedServices.includes(roleService) : false;
}

export function getReportTypesForSidebar(
  role: Role,
  groupService: Service | null = null
) {
  return getReportTypesForRole(role, groupService).map(reportType => ({
    href: reportType.listPath,
    title: reportType.title,
  }));
}

export function getServiceForRole(
  _role: Role,
  groupService: Service | null = null
): Service | null {
  return groupService;
}

export function getRolesForService(service: Service): Role[] {
  void service;
  return ["leader", "subleader", "agent", "convoyer"];
}

export function getAllowedServicesForReportType(
  reportType: ReportTypeDefinition
) {
  return reportType.allowedServices;
}

export function getAvailablePlatformReportRoles() {
  return [...PLATFORM_REPORT_ROLES];
}
