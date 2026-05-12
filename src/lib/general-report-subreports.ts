import type { Service } from "@/generated/prisma/enums";
import type {
  ReportFieldDefinition,
  ReportFieldType,
  ReportTypeSlug,
} from "@/lib/report-types";

export type GeneralSubReportSlug = Exclude<ReportTypeSlug, "general">;

export type GeneralSubReportEntry = Record<string, string | boolean>;

export type GeneralSubReportPayload = Partial<
  Record<GeneralSubReportSlug, GeneralSubReportEntry[]>
>;

type ServiceFieldMap = Partial<
  Record<Service, readonly ReportFieldDefinition[]>
>;

export type GeneralSubReportSection = {
  slug: GeneralSubReportSlug;
  title: string;
  description: string;
  emptyLabel: string;
  relationKey: string;
  fieldsByService: ServiceFieldMap;
};

function field(
  key: string,
  label: string,
  type: ReportFieldType,
  placeholder?: string
): ReportFieldDefinition {
  return { key, label, type, placeholder };
}

export const GENERAL_SUBREPORT_SECTIONS = [
  {
    slug: "colis-non-vus",
    title: "Colis non vus",
    description:
      "Ajoutez autant de signalements que nécessaire pour les colis ou situations non retrouvés.",
    emptyLabel: "Aucun colis non vu ajouté.",
    relationKey: "colisNonVus",
    fieldsByService: {
      envoi: [
        field("immatriculation", "Immatriculation", "text"),
        field("agenceDepart", "Agence départ", "text"),
        field("description", "Description", "textarea"),
        field("destinataire", "Destinataire", "text"),
        field("actionMenee", "Action menée", "textarea"),
      ],
      piste: [
        field("destination", "Destination", "text"),
        field("provenance", "Provenance", "text"),
        field("description", "Description", "textarea"),
        field("personnesContactees", "Personne(s) contactée(s)", "textarea"),
      ],
    },
  },
  {
    slug: "colis-hors-bordereaux",
    title: "Colis hors bordereaux",
    description:
      "Regroupez ici les colis trouvés hors bordereau avec seulement les informations utiles.",
    emptyLabel: "Aucun colis hors bordereau ajouté.",
    relationKey: "colisHorsBordereaux",
    fieldsByService: {
      envoi: [
        field("agenceDepart", "Agence départ", "text"),
        field("description", "Description", "textarea"),
        field("destinataire", "Destinataire", "text"),
        field("destinatairePhone", "N° de téléphone", "text"),
      ],
      retrait: [
        field("agenceDepart", "Agence départ", "text"),
        field("description", "Description", "textarea"),
        field("destinataire", "Destinataire", "text"),
        field("destinatairePhone", "Numéro du destinataire", "text"),
        field("actionMenee", "Action menée", "textarea"),
      ],
    },
  },
  {
    slug: "erreurs-destination",
    title: "Erreurs de destination",
    description:
      "Centralisez les erreurs de destination liées au service courant.",
    emptyLabel: "Aucune erreur de destination ajoutée.",
    relationKey: "erreursDestination",
    fieldsByService: {
      envoi: [
        field("immatriculation", "Immatriculation", "text"),
        field("destination", "Destination", "text"),
        field("telephone", "N° téléphone", "text"),
        field("description", "Description", "textarea"),
        field("destinationPrevue", "Destination prévue", "text"),
        field("destinationErronee", "Destination erronée", "text"),
      ],
      piste: [
        field("nom", "Nom", "text"),
        field("telephone", "N° téléphone", "text"),
        field("description", "Description", "textarea"),
        field("destinataire", "Destinataire", "text"),
        field("equipeFacturation", "Équipe de facturation", "text"),
      ],
      retrait: [
        field("immatriculation", "Immatriculation", "text"),
        field("destination", "Destination", "text"),
        field("description", "Description", "textarea"),
        field("destinationPrevue", "Destination prévue", "text"),
        field("destinationErronee", "Destination erronée", "text"),
      ],
    },
  },
  {
    slug: "colis-retardes",
    title: "Colis retardés",
    description:
      "Déclarez ici les colis retardés avec le motif et l'action en cours.",
    emptyLabel: "Aucun colis retardé ajouté.",
    relationKey: "colisRetardes",
    fieldsByService: {
      piste: [
        field("codeColis", "Code colis", "text"),
        field("description", "Description", "textarea"),
        field("destinataire", "Destinataire", "text"),
        field("motifRetard", "Motif du retard", "textarea"),
        field("actionEnCours", "Action en cours", "textarea"),
      ],
    },
  },
  {
    slug: "colis-non-identifies",
    title: "Colis non identifiés",
    description:
      "Signalez les colis non identifiés avec une description minimale et l'action menée.",
    emptyLabel: "Aucun colis non identifié ajouté.",
    relationKey: "colisNonIdentifies",
    fieldsByService: {
      piste: [
        field("descriptionColis", "Description du colis", "textarea"),
        field(
          "motifNonIdentification",
          "Motif de non identification",
          "textarea"
        ),
        field("actionMenee", "Action menée", "textarea"),
      ],
    },
  },
  {
    slug: "colis-transferes",
    title: "Colis transférés",
    description:
      "Ajoutez les transferts de colis constatés pendant le service.",
    emptyLabel: "Aucun colis transféré ajouté.",
    relationKey: "colisTransferes",
    fieldsByService: {
      piste: [
        field("destination", "Destination", "text"),
        field("numeroBordereau", "Numéro de bordereau", "text"),
        field("nombreColis", "Nombre de colis", "number"),
        field("chauffeur", "Chauffeur", "text"),
        field("statut", "Statut", "text"),
      ],
    },
  },
  {
    slug: "convoyeurs-absents",
    title: "Convoyeurs absents",
    description:
      "Consignez les convoyeurs absents avec les références strictement utiles.",
    emptyLabel: "Aucun convoyeur absent ajouté.",
    relationKey: "convoyeursAbsents",
    fieldsByService: {
      envoi: [
        field("nom", "Nom", "text"),
        field("numero", "Numéro", "text"),
        field("vehicule", "Véhicule", "text"),
        field("agenceProvenance", "Agence de provenance", "text"),
      ],
    },
  },
  {
    slug: "bordereaux-non-conformes",
    title: "Bordereaux non conformes",
    description:
      "Mentionnez les bordereaux non conformes en restant sur l'état constaté.",
    emptyLabel: "Aucun bordereau non conforme ajouté.",
    relationKey: "bordereauxNonConformes",
    fieldsByService: {
      envoi: [
        field(
          "motifNonConformite",
          "État des bordereaux non conformes (signé ou pas)",
          "textarea"
        ),
      ],
    },
  },
  {
    slug: "vehicules-embarques",
    title: "Véhicules embarqués",
    description:
      "Ajoutez la situation des colis et véhicules embarqués pour la piste.",
    emptyLabel: "Aucun véhicule embarqué ajouté.",
    relationKey: "vehiculesEmbarques",
    fieldsByService: {
      piste: [
        field("immatriculation", "Immatriculation", "text"),
        field("destination", "Destination", "text"),
        field("heure", "Heure", "time"),
        field(
          "retourReceptionColis",
          "Retour de réception des colis",
          "textarea"
        ),
        field("presenceConvoyeurs", "Présence de convoyeurs", "textarea"),
      ],
    },
  },
] as const satisfies readonly GeneralSubReportSection[];

export function getGeneralSubReportSections(service: Service) {
  return GENERAL_SUBREPORT_SECTIONS.filter(section =>
    Object.prototype.hasOwnProperty.call(section.fieldsByService, service)
  );
}

export function getGeneralSubReportSectionBySlug(slug: GeneralSubReportSlug) {
  return (
    GENERAL_SUBREPORT_SECTIONS.find(section => section.slug === slug) ?? null
  );
}

export function getGeneralSubReportFields(
  slug: GeneralSubReportSlug,
  service: Service
) {
  const section = getGeneralSubReportSectionBySlug(slug);

  if (!section) {
    return [] as readonly ReportFieldDefinition[];
  }

  return (section.fieldsByService as ServiceFieldMap)[service] ?? [];
}

export function createEmptyGeneralSubReportEntry(
  slug: GeneralSubReportSlug,
  service: Service
): GeneralSubReportEntry {
  return Object.fromEntries(
    getGeneralSubReportFields(slug, service).map(
      (fieldDef: ReportFieldDefinition) => [
        fieldDef.key,
        fieldDef.type === "checkbox" ? false : "",
      ]
    )
  );
}

export function getGeneralSubReportFieldKeys(slug: GeneralSubReportSlug) {
  const section = getGeneralSubReportSectionBySlug(slug);

  if (!section) {
    return [];
  }

  return Array.from(
    new Set(
      Object.values(section.fieldsByService)
        .flat()
        .map(fieldDef => fieldDef.key)
    )
  );
}

export function isGeneralSubReportEntryEmpty(
  slug: GeneralSubReportSlug,
  service: Service,
  entry: Record<string, unknown>
) {
  return getGeneralSubReportFields(slug, service).every(
    (fieldDef: ReportFieldDefinition) => {
      const value = entry[fieldDef.key];

      if (typeof value === "boolean") {
        return value === false;
      }

      return !String(value ?? "").trim();
    }
  );
}
