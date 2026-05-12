import type {
  AttendanceStatus,
  Impact,
  Role,
  Service,
} from "../../src/generated/prisma/enums";

export type RootSeedConfig = {
  username: string;
  password: string;
  fullName: string;
};

export type SeedUserDefinition = {
  key: string;
  fullName: string;
  username: string;
  password: string;
  role: Role;
  groupKey: string | null;
  phone: string | null;
  isActive: boolean;
};

export type SeedGroupDefinition = {
  key: string;
  name: string;
  service: Service;
  isActive: boolean;
};

export type SeedCriterionDefinition = {
  key: string;
  name: string;
  impact: Impact;
  defaultWeight: string;
  maxDaily: number | null;
  isActive: boolean;
};

export type SeedAttendanceCriterionSettingDefinition = {
  criterionKey: string;
  status: AttendanceStatus;
};

export type SeedDailyGeneralReportDefinition = {
  reportDate: string;
  groupKey: string;
  reportedByKey: string;
  personnelPresent: string;
  personnelAbsent: string;
  ambianceGenerale: string;
  problemesRencontres: string;
  etatGeneralService: string;
  passationService: string;
  observationGeneral: string;
  createdAt: string;
};

export type SeedColisNonVuDefinition = {
  reportDate: string;
  service: Service;
  description: string;
  destination?: string;
  provenance?: string;
  personnesContactees?: string;
  immatriculation?: string;
  agenceDepart?: string;
  destinataire?: string;
  actionMenee?: string;
  reportedByKey: string;
  createdAt: string;
};

export type SeedColisHorsBordereauDefinition = {
  reportDate: string;
  agenceDepart: string;
  description: string;
  destinataire: string;
  destinatairePhone: string;
  actionMenee: string;
  reportedByKey: string;
  createdAt: string;
};

export type SeedErreurDestinationDefinition = {
  reportDate: string;
  description: string;
  nom?: string;
  telephone?: string;
  destinataire?: string;
  equipeFacturation?: string;
  immatriculation?: string;
  destination?: string;
  destinationPrevue?: string;
  destinationErronee?: string;
  reportedByKey: string;
  createdAt: string;
};

export type SeedColisRetardeDefinition = {
  reportDate: string;
  codeColis: string;
  description: string;
  destinataire: string;
  motifRetard: string;
  actionEnCours: string;
  reportedByKey: string;
  createdAt: string;
};

export type SeedColisNonIdentifieDefinition = {
  reportDate: string;
  descriptionColis: string;
  motifNonIdentification: string;
  actionMenee: string;
  reportedByKey: string;
  createdAt: string;
};

export type SeedColisTransfereDefinition = {
  reportDate: string;
  destination: string;
  numeroBordereau: string;
  nombreColis: number;
  chauffeur: string;
  statut: string;
  reportedByKey: string;
  createdAt: string;
};

export type SeedConvoyeurAbsentDefinition = {
  reportDate: string;
  nom: string;
  numero: string;
  vehicule: string;
  agenceProvenance: string;
  userKey: string | null;
  reportedByKey: string;
  createdAt: string;
};

export type SeedBordereauNonConformeDefinition = {
  reportDate: string;
  numeroBordereau: string;
  motifNonConformite: string;
  actionMenee: string;
  reportedByKey: string;
  createdAt: string;
};

export type SeedVehiculeEmbarqueDefinition = {
  reportDate: string;
  immatriculation: string;
  destination: string;
  heure: string;
  retourReceptionColis: string;
  presenceConvoyeurs: string;
  reportedByKey: string;
  createdAt: string;
};

export type SeedSignatureLogDefinition = {
  slipNumber: string;
  signedAt: string;
  busArrivalTime: string | null;
  userKey: string;
};

export type SeedPersonnelEvaluationDefinition = {
  evaluationDate: string;
  userKey: string;
  criteriaKey: string;
  weightOverride: string | null;
  notes: string;
  recordedByKey: string;
  createdAt: string;
};

type SeedServiceReportEntry = Omit<
  SeedDailyGeneralReportDefinition,
  "groupKey" | "reportedByKey"
>;

function buildServiceReports(
  groupKey: string,
  reportedByKey: string,
  entries: SeedServiceReportEntry[]
): SeedDailyGeneralReportDefinition[] {
  return entries.map(entry => ({
    ...entry,
    groupKey,
    reportedByKey,
  }));
}

export function getSeedUsers(rootConfig: RootSeedConfig): SeedUserDefinition[] {
  return [
    {
      key: "root",
      fullName: rootConfig.fullName,
      username: rootConfig.username,
      password: rootConfig.password,
      role: "admin",
      groupKey: null,
      phone: "+221700000001",
      isActive: true,
    },
    {
      key: "admin_ops",
      fullName: "Aissatou Ndiaye",
      username: "aissatou.admin",
      password: "Admin123!",
      role: "admin",
      groupKey: null,
      phone: "+221700000002",
      isActive: true,
    },
    {
      key: "leader_envoi",
      fullName: "Moussa Diop",
      username: "moussa.envoi",
      password: "Leader123!",
      role: "leader",
      groupKey: "group_envoi",
      phone: "+221700000010",
      isActive: true,
    },
    {
      key: "leader_piste",
      fullName: "Cheikh Ba",
      username: "cheikh.piste",
      password: "Leader123!",
      role: "subleader",
      groupKey: "group_piste",
      phone: "+221700000011",
      isActive: true,
    },
    {
      key: "leader_retrait",
      fullName: "Fatou Sow",
      username: "fatou.retrait",
      password: "Leader123!",
      role: "subleader",
      groupKey: "group_retrait",
      phone: "+221700000012",
      isActive: true,
    },
    {
      key: "agent_abdoulaye",
      fullName: "Abdoulaye Faye",
      username: "abdoulaye.faye",
      password: "Agent123!",
      role: "agent",
      groupKey: "group_envoi",
      phone: "+221700000101",
      isActive: true,
    },
    {
      key: "agent_mariama",
      fullName: "Mariama Diallo",
      username: "mariama.diallo",
      password: "Agent123!",
      role: "agent",
      groupKey: "group_piste",
      phone: "+221700000102",
      isActive: true,
    },
    {
      key: "agent_ibrahima",
      fullName: "Ibrahima Seck",
      username: "ibrahima.seck",
      password: "Agent123!",
      role: "agent",
      groupKey: "group_retrait",
      phone: "+221700000103",
      isActive: true,
    },
    {
      key: "agent_khady",
      fullName: "Khady Gueye",
      username: "khady.gueye",
      password: "Agent123!",
      role: "agent",
      groupKey: "group_envoi",
      phone: "+221700000104",
      isActive: true,
    },
    {
      key: "agent_awa",
      fullName: "Awa Toure",
      username: "awa.toure",
      password: "Agent123!",
      role: "agent",
      groupKey: "group_piste",
      phone: "+221700000105",
      isActive: false,
    },
    {
      key: "convoyeur_ousmane",
      fullName: "Ousmane Kane",
      username: "ousmane.kane",
      password: "Convoyeur123!",
      role: "convoyer",
      groupKey: "group_envoi",
      phone: "+221700000201",
      isActive: true,
    },
    {
      key: "convoyeur_binta",
      fullName: "Binta Fall",
      username: "binta.fall",
      password: "Convoyeur123!",
      role: "convoyer",
      groupKey: "group_piste",
      phone: "+221700000202",
      isActive: true,
    },
    {
      key: "convoyeur_aliou",
      fullName: "Aliou Sarr",
      username: "aliou.sarr",
      password: "Convoyeur123!",
      role: "convoyer",
      groupKey: "group_retrait",
      phone: "+221700000203",
      isActive: true,
    },
  ];
}

export const SEED_GROUPS: SeedGroupDefinition[] = [
  {
    key: "group_envoi",
    name: "Equipe Envoi",
    service: "envoi",
    isActive: true,
  },
  {
    key: "group_piste",
    name: "Equipe Piste",
    service: "piste",
    isActive: true,
  },
  {
    key: "group_retrait",
    name: "Equipe Retrait",
    service: "retrait",
    isActive: true,
  },
];

export const SEED_CRITERIA: SeedCriterionDefinition[] = [
  {
    key: "ponctualite",
    name: "Ponctualite a la prise de poste",
    impact: "POSITIVE",
    defaultWeight: "2.50",
    maxDaily: 1,
    isActive: true,
  },
  {
    key: "discipline_securite",
    name: "Respect des consignes de securite",
    impact: "POSITIVE",
    defaultWeight: "3.00",
    maxDaily: null,
    isActive: true,
  },
  {
    key: "qualite_tri",
    name: "Qualite du tri et du classement des colis",
    impact: "POSITIVE",
    defaultWeight: "2.00",
    maxDaily: 1,
    isActive: true,
  },
  {
    key: "relation_client",
    name: "Qualite de l'accueil client au retrait",
    impact: "POSITIVE",
    defaultWeight: "2.50",
    maxDaily: 1,
    isActive: true,
  },
  {
    key: "initiative",
    name: "Initiative dans le traitement des anomalies",
    impact: "POSITIVE",
    defaultWeight: "1.50",
    maxDaily: null,
    isActive: true,
  },
  {
    key: "productivite",
    name: "Productivite en periode de pointe",
    impact: "POSITIVE",
    defaultWeight: "2.00",
    maxDaily: 1,
    isActive: true,
  },
  {
    key: "cooperation",
    name: "Cooperation inter-equipes et entraide",
    impact: "POSITIVE",
    defaultWeight: "1.50",
    maxDaily: 1,
    isActive: true,
  },
  {
    key: "retard_poste",
    name: "Retard a la prise de poste",
    impact: "NEGATIVE",
    defaultWeight: "-1.50",
    maxDaily: 1,
    isActive: true,
  },
  {
    key: "erreur_destination",
    name: "Erreur de destination ou de ventilation",
    impact: "NEGATIVE",
    defaultWeight: "-2.50",
    maxDaily: 1,
    isActive: true,
  },
  {
    key: "bordereau_incomplet",
    name: "Bordereau incomplet ou non conforme",
    impact: "NEGATIVE",
    defaultWeight: "-2.00",
    maxDaily: 1,
    isActive: true,
  },
  {
    key: "absence_non_justifiee",
    name: "Absence non justifiee impactant le service",
    impact: "NEGATIVE",
    defaultWeight: "-3.00",
    maxDaily: 1,
    isActive: true,
  },
  {
    key: "transmission_tardive",
    name: "Transmission tardive des informations de service",
    impact: "NEGATIVE",
    defaultWeight: "-1.00",
    maxDaily: 1,
    isActive: true,
  },
];

export const SEED_ATTENDANCE_CRITERION_SETTINGS: SeedAttendanceCriterionSettingDefinition[] =
  [
    {
      criterionKey: "ponctualite",
      status: "PRESENT",
    },
    {
      criterionKey: "absence_non_justifiee",
      status: "ABSENT",
    },
  ];

const ENVOI_REPORTS: SeedServiceReportEntry[] = [
  {
    reportDate: "2026-04-20",
    personnelPresent: "Moussa Diop, Abdoulaye Faye, Khady Gueye, Ousmane Kane",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Debut de semaine fluide avec mise en quai des 06h15.",
    problemesRencontres:
      "Ralentissement de 20 minutes sur le quai 2 au premier chargement.",
    etatGeneralService: "17 bordereaux traites sans reliquat important.",
    passationService: "Aucun point bloquant pour la vacation suivante.",
    observationGeneral:
      "Prevoir un renfort manutention les lundis de forte arrivee.",
    createdAt: "2026-04-20T08:10:00.000Z",
  },
  {
    reportDate: "2026-04-21",
    personnelPresent: "Moussa Diop, Abdoulaye Faye, Ousmane Kane, Aliou Sarr",
    personnelAbsent: "Khady Gueye (formation interne)",
    ambianceGenerale: "Equipe reactive malgre un pic de chargement a 09h00.",
    problemesRencontres:
      "Bordereau E-214 incomplet avant depart vers Tambacounda.",
    etatGeneralService:
      "19 expeditions cloturees apres regularisation documentaire.",
    passationService: "Le lot E-214 est parti apres signature du complement.",
    observationGeneral:
      "Renforcer le controle documentaire au guichet d'acceptation.",
    createdAt: "2026-04-21T08:15:00.000Z",
  },
  {
    reportDate: "2026-04-22",
    personnelPresent: "Moussa Diop, Abdoulaye Faye, Khady Gueye, Ousmane Kane",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Cadence soutenue mais equipe stable sur tout le poste.",
    problemesRencontres:
      "Un transfert inter-agences a exige un comptage supplementaire.",
    etatGeneralService:
      "18 chargements finalises dont un transfert vers Kaolack.",
    passationService: "Surveiller le suivi du transfert TRF-2204.",
    observationGeneral:
      "Le marquage des palettes export doit etre homogeneise.",
    createdAt: "2026-04-22T08:18:00.000Z",
  },
  {
    reportDate: "2026-04-24",
    personnelPresent: "Moussa Diop, Abdoulaye Faye, Ousmane Kane, Aliou Sarr",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Forte activite avant week-end avec bonne tenue de quai.",
    problemesRencontres:
      "Deux bordereaux export ont exige un controle supplementaire.",
    etatGeneralService: "22 expeditions preparees dont 6 en chargement direct.",
    passationService:
      "Le dossier export NIG-448 reste en attente de validation finale.",
    observationGeneral:
      "Le stock d'adhesif securise doit etre releve avant lundi.",
    createdAt: "2026-04-24T08:25:00.000Z",
  },
  {
    reportDate: "2026-04-27",
    personnelPresent: "Moussa Diop, Abdoulaye Faye, Khady Gueye, Ousmane Kane",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Reprise de semaine serieuse avec volumes en hausse.",
    problemesRencontres:
      "Pluie matinale ayant ralenti l'acces camion pendant 30 minutes.",
    etatGeneralService: "20 expeditions chargees et documentees correctement.",
    passationService: "Suivre l'arrivee tardive du camion de Saint-Louis.",
    observationGeneral:
      "Les housses de protection palettes ont ete utiles pendant l'averse.",
    createdAt: "2026-04-27T08:09:00.000Z",
  },
  {
    reportDate: "2026-04-28",
    personnelPresent: "Moussa Diop, Abdoulaye Faye, Aliou Sarr",
    personnelAbsent: "Ousmane Kane (maladie)",
    ambianceGenerale:
      "Equipe sous tension en debut de poste puis retour a la normale.",
    problemesRencontres:
      "Absence convoyeur ayant reporte le depart du lot KOL-281.",
    etatGeneralService:
      "16 expeditions traitees avec un depart differe vers Kolda.",
    passationService: "Le convoyage de rattrapage est prevu a 20h30.",
    observationGeneral:
      "Formaliser une liste de convoyeurs de reserve pour les nuits chargees.",
    createdAt: "2026-04-28T08:27:00.000Z",
  },
  {
    reportDate: "2026-04-30",
    personnelPresent: "Moussa Diop, Abdoulaye Faye, Khady Gueye, Ousmane Kane",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Veille de jour ferie tres sollicitee des 07h00.",
    problemesRencontres:
      "Un transfert supplementaire a ete ouvert pour des colis de Touba.",
    etatGeneralService: "24 expeditions finalisees, record de la quinzaine.",
    passationService:
      "Le transfert TRF-300 doit etre confirme au point de depart a 19h30.",
    observationGeneral:
      "Anticiper davantage de contenants le dernier jour ouvrable du mois.",
    createdAt: "2026-04-30T08:30:00.000Z",
  },
  {
    reportDate: "2026-05-01",
    personnelPresent: "Moussa Diop, Ousmane Kane",
    personnelAbsent: "Abdoulaye Faye, Khady Gueye (jour ferie)",
    ambianceGenerale:
      "Service minimum assure pour les urgences et transferts planifies.",
    problemesRencontres: "Aucune anomalie critique sur le flux ferie.",
    etatGeneralService: "6 expeditions urgentes traitees.",
    passationService:
      "Les lots standards reprendront lundi avec controle des reliquats.",
    observationGeneral: "Le dispositif de service minimum a ete suffisant.",
    createdAt: "2026-05-01T09:05:00.000Z",
  },
  {
    reportDate: "2026-05-04",
    personnelPresent: "Moussa Diop, Abdoulaye Faye, Khady Gueye, Aliou Sarr",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Reprise post-ferie avec tres gros volume des 06h00.",
    problemesRencontres:
      "Un scanner portatif est tombe en panne pendant 40 minutes.",
    etatGeneralService: "23 expeditions maintenues grace a la saisie manuelle.",
    passationService: "Le scanner de secours a ete attribue au quai 1.",
    observationGeneral:
      "Prevoir une maintenance preventive hebdomadaire des douchettes.",
    createdAt: "2026-05-04T08:28:00.000Z",
  },
  {
    reportDate: "2026-05-05",
    personnelPresent: "Moussa Diop, Abdoulaye Faye, Khady Gueye, Ousmane Kane",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Cadence revenue a la normale avec bon moral d'equipe.",
    problemesRencontres:
      "Un transfert Touba a exige un comptage contradictoire avant depart.",
    etatGeneralService: "21 expeditions et 2 transferts fermes sans reliquat.",
    passationService:
      "Conserver la fiche de comptage du transfert TRF-505 dans le dossier jour.",
    observationGeneral:
      "Les procedures de reprise post-panne ont ete bien appliquees.",
    createdAt: "2026-05-05T08:14:00.000Z",
  },
];

const PISTE_REPORTS: SeedServiceReportEntry[] = [
  {
    reportDate: "2026-04-20",
    personnelPresent: "Cheikh Ba, Mariama Diallo, Ibrahima Seck, Binta Fall",
    personnelAbsent: "Aucun",
    ambianceGenerale:
      "Equipe concentree, bonne coordination entre pointage et tri.",
    problemesRencontres:
      "Deux colis sans etiquette lisible isoles pour verification.",
    etatGeneralService: "Volume moyen, traitement termine avant 14h30.",
    passationService:
      "Les colis isoles ont ete remis au controle documentaire.",
    observationGeneral: "Les bacs rouges manquent sur la zone de tri fin.",
    createdAt: "2026-04-20T13:05:00.000Z",
  },
  {
    reportDate: "2026-04-21",
    personnelPresent: "Cheikh Ba, Mariama Diallo, Ibrahima Seck",
    personnelAbsent: "Binta Fall (mission convoyage)",
    ambianceGenerale: "Rythme soutenu avec bonne entraide entre agents.",
    problemesRencontres: "Un colis fragile a ete retrouve hors bordereau.",
    etatGeneralService: "Tri termine a 15h10 avec reprise du retard.",
    passationService: "Le colis fragile a ete rattache au bon manifeste.",
    observationGeneral:
      "Les etiquetteurs thermiques restent sensibles aux coupures de papier.",
    createdAt: "2026-04-21T13:20:00.000Z",
  },
  {
    reportDate: "2026-04-22",
    personnelPresent: "Cheikh Ba, Ibrahima Seck, Binta Fall",
    personnelAbsent: "Mariama Diallo (autorisation d'absence)",
    ambianceGenerale: "Ambiance studieuse avec travail organise par zones.",
    problemesRencontres:
      "Une erreur de ventilation vers Thies a ete corrigee avant depart.",
    etatGeneralService:
      "Volume eleve mais maitrise grace au reclassement rapide.",
    passationService:
      "Le lot corrige pour Thies est reparti sur le circuit normal.",
    observationGeneral:
      "La zone Saint-Louis doit etre davantage balisee pour les nouveaux agents.",
    createdAt: "2026-04-22T13:08:00.000Z",
  },
  {
    reportDate: "2026-04-24",
    personnelPresent: "Cheikh Ba, Mariama Diallo, Ibrahima Seck",
    personnelAbsent: "Binta Fall (convoyage exceptionnel)",
    ambianceGenerale:
      "Charge importante mais circulation fluide sur les tapis.",
    problemesRencontres:
      "Une palette vers Matam a ete reclassee apres double scan.",
    etatGeneralService: "Sortie des lots finalisee avant 16h00.",
    passationService:
      "Le reclassement Matam a ete confirme dans le tableau de suivi.",
    observationGeneral:
      "Le pointage amont doit mieux separer express et standard.",
    createdAt: "2026-04-24T13:25:00.000Z",
  },
  {
    reportDate: "2026-04-27",
    personnelPresent: "Cheikh Ba, Mariama Diallo, Ibrahima Seck, Binta Fall",
    personnelAbsent: "Aucun",
    ambianceGenerale:
      "Bonne mobilisation, tri repris rapidement apres l'averse.",
    problemesRencontres:
      "Humidite sur des etiquettes de colis express venant de Mbour.",
    etatGeneralService: "Les lots urgents ont ete rescannes avant dispatch.",
    passationService:
      "Maintenir les colis express a part jusqu'au controle final.",
    observationGeneral:
      "Installer davantage de baches sur la zone transitoire.",
    createdAt: "2026-04-27T13:11:00.000Z",
  },
  {
    reportDate: "2026-04-28",
    personnelPresent: "Cheikh Ba, Ibrahima Seck, Binta Fall",
    personnelAbsent: "Mariama Diallo (conge)",
    ambianceGenerale:
      "Cadence reguliere avec vigilance sur les anomalies d'etiquetage.",
    problemesRencontres:
      "Un colis pour Kaolack etait dirige a tort vers Touba.",
    etatGeneralService:
      "Correction effectuee avant embarquement, sans impact client.",
    passationService: "Tracer l'origine de l'erreur sur la vacation du matin.",
    observationGeneral:
      "Le double controle scan avant fermeture de lot reste indispensable.",
    createdAt: "2026-04-28T13:16:00.000Z",
  },
  {
    reportDate: "2026-04-30",
    personnelPresent: "Cheikh Ba, Mariama Diallo, Ibrahima Seck, Binta Fall",
    personnelAbsent: "Aucun",
    ambianceGenerale:
      "Forte activite de fin de mois avec bon respect des priorites express.",
    problemesRencontres:
      "Un bordereau de Matam comportait un ecart entre nombre annonce et nombre reel.",
    etatGeneralService: "L'ecart a ete documente avant cloture de reception.",
    passationService:
      "Conserver le bordereau corrige dans la chemise litiges du jour.",
    observationGeneral:
      "Les arrivees de fin de mois demandent un controle quantitatif plus strict.",
    createdAt: "2026-04-30T13:22:00.000Z",
  },
  {
    reportDate: "2026-05-01",
    personnelPresent: "Cheikh Ba, Binta Fall",
    personnelAbsent: "Mariama Diallo, Ibrahima Seck (jour ferie)",
    ambianceGenerale: "Traitement calme des flux urgents uniquement.",
    problemesRencontres:
      "Deux colis prioritaires sans etiquette finale ont ete completes manuellement.",
    etatGeneralService: "Activite reduite et maitrisee.",
    passationService: "Reprise normale des volumes prevue le 04 mai.",
    observationGeneral:
      "Le stock de consommables reste suffisant apres inventaire rapide.",
    createdAt: "2026-05-01T12:15:00.000Z",
  },
  {
    reportDate: "2026-05-04",
    personnelPresent: "Cheikh Ba, Mariama Diallo, Ibrahima Seck, Binta Fall",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Forte densite sur les arrivees, equipe tres engagee.",
    problemesRencontres:
      "Trois colis de Mbour ont ete declares non vus avant d'etre retrouves sur palette mixte.",
    etatGeneralService: "Le retard accumule a ete absorbe avant 16h30.",
    passationService:
      "Revoir le marquage des palettes mixtes avec les manutentionnaires.",
    observationGeneral:
      "Le poste de tri express doit etre agrandi en reprise de ferie.",
    createdAt: "2026-05-04T13:29:00.000Z",
  },
  {
    reportDate: "2026-05-05",
    personnelPresent: "Cheikh Ba, Mariama Diallo, Ibrahima Seck, Binta Fall",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Journee reguliere avec bonne qualite de ventilation.",
    problemesRencontres:
      "Un colis destine a Richard-Toll a ete signale hors bordereau puis regularise.",
    etatGeneralService: "Aucun reliquat sur les lots du soir.",
    passationService:
      "Mettre a jour le tableau des anomalies avec le dossier HT-505.",
    observationGeneral:
      "Le rangement par couloir a reduit les erreurs de manipulation.",
    createdAt: "2026-05-05T13:12:00.000Z",
  },
];

const RETRAIT_REPORTS: SeedServiceReportEntry[] = [
  {
    reportDate: "2026-04-20",
    personnelPresent: "Fatou Sow, Khady Gueye, Abdoulaye Faye",
    personnelAbsent: "Aucun",
    ambianceGenerale:
      "Affluence reguliere au comptoir, file d'attente contenue.",
    problemesRencontres:
      "Une reclamation sur un colis non disponible a ete prise en charge.",
    etatGeneralService: "78 retraits servis sans incident majeur.",
    passationService: "Relancer la piste sur le colis AWB-RT-2004.",
    observationGeneral:
      "Le stock de pochettes de remise doit etre reapprovisionne.",
    createdAt: "2026-04-20T18:05:00.000Z",
  },
  {
    reportDate: "2026-04-21",
    personnelPresent: "Fatou Sow, Khady Gueye, Mariama Diallo",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Equipe disponible, tres bon accueil au comptoir.",
    problemesRencontres:
      "Deux clients sont revenus pour des colis annonces non vus en systeme.",
    etatGeneralService:
      "84 retraits clotures, temps d'attente inferieur a 8 minutes.",
    passationService: "Suivre les recherches des AWB-RT-2107 et AWB-RT-2111.",
    observationGeneral:
      "Le standard a recu plusieurs appels sur les horaires du samedi.",
    createdAt: "2026-04-21T18:12:00.000Z",
  },
  {
    reportDate: "2026-04-22",
    personnelPresent: "Fatou Sow, Khady Gueye, Abdoulaye Faye",
    personnelAbsent: "Aucun",
    ambianceGenerale:
      "Frequentation stable avec plusieurs remises societes en matinee.",
    problemesRencontres:
      "Un colis retarde de Ziguinchor a provoque trois passages client.",
    etatGeneralService:
      "71 retraits effectues et 9 colis maintenus en reserve.",
    passationService:
      "Informer le client de AWB-RT-2219 des nouvelles previsions d'arrivee.",
    observationGeneral:
      "Les recus de remise sont complets et correctement archives.",
    createdAt: "2026-04-22T18:00:00.000Z",
  },
  {
    reportDate: "2026-04-24",
    personnelPresent: "Fatou Sow, Khady Gueye, Abdoulaye Faye",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Affluence soutenue avant fermeture hebdomadaire.",
    problemesRencontres:
      "Deux retards d'acheminement expliques aux clients professionnels.",
    etatGeneralService:
      "96 retraits servis avec une file controlee jusqu'a 18h.",
    passationService:
      "Mettre de cote les dossiers de relance de Kaolack pour samedi matin.",
    observationGeneral:
      "La signaletique du comptoir prioritaire est bien respectee.",
    createdAt: "2026-04-24T18:15:00.000Z",
  },
  {
    reportDate: "2026-04-27",
    personnelPresent: "Fatou Sow, Khady Gueye, Mariama Diallo",
    personnelAbsent: "Abdoulaye Faye (renfort en envoi)",
    ambianceGenerale:
      "Frequentation moderee en matinee puis hausse en fin de journee.",
    problemesRencontres:
      "Un client a conteste la date de mise a disposition d'un colis non vu.",
    etatGeneralService:
      "74 remises effectives avec 6 dossiers de recherche ouverts.",
    passationService:
      "Reprendre le suivi du dossier AWB-RT-2714 avec la piste.",
    observationGeneral:
      "Le cahier de reservation des colis sensibles est bien tenu.",
    createdAt: "2026-04-27T18:07:00.000Z",
  },
  {
    reportDate: "2026-04-28",
    personnelPresent: "Fatou Sow, Khady Gueye, Abdoulaye Faye",
    personnelAbsent: "Aucun",
    ambianceGenerale:
      "File stable, plusieurs remises entreprises traitees avant midi.",
    problemesRencontres:
      "Un colis fragile a ete remis avec controle d'etat contradictoire.",
    etatGeneralService: "81 retraits aboutis et 4 reports clientifies.",
    passationService:
      "Archiver la fiche de reserve du colis FRG-282 avant fermeture.",
    observationGeneral:
      "Les clients signent plus vite avec preparation des recus en amont.",
    createdAt: "2026-04-28T18:11:00.000Z",
  },
  {
    reportDate: "2026-04-30",
    personnelPresent: "Fatou Sow, Khady Gueye, Abdoulaye Faye",
    personnelAbsent: "Aucun",
    ambianceGenerale:
      "Journee intense avec beaucoup de remises avant fermeture feriee.",
    problemesRencontres:
      "Trois colis attendus n'etaient pas encore pointes a l'arrivee.",
    etatGeneralService:
      "104 retraits effectues et 12 promesses de retrait reportees.",
    passationService:
      "Informer les clients reportes de la disponibilite samedi a partir de 09h00.",
    observationGeneral:
      "Les tickets d'appel numeriques ont fluidifie le comptoir.",
    createdAt: "2026-04-30T18:22:00.000Z",
  },
  {
    reportDate: "2026-05-01",
    personnelPresent: "Fatou Sow, Khady Gueye",
    personnelAbsent: "Abdoulaye Faye (jour ferie)",
    ambianceGenerale:
      "Guichet ouvert sur plage reduite pour les retraits urgents.",
    problemesRencontres:
      "Une procuration manquait sur un retrait entreprise et a ete reportee.",
    etatGeneralService: "29 retraits urgents traites sur la plage matinale.",
    passationService: "Le dossier entreprise REP-501 sera reprogramme lundi.",
    observationGeneral:
      "Bonne comprehension des clients sur les horaires exceptionnels.",
    createdAt: "2026-05-01T14:05:00.000Z",
  },
  {
    reportDate: "2026-05-04",
    personnelPresent: "Fatou Sow, Khady Gueye, Abdoulaye Faye",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Tres forte affluence a la reprise apres le ferie.",
    problemesRencontres:
      "Deux colis retardes ont du etre reprogrammes pour le lendemain matin.",
    etatGeneralService: "111 remises effectuees, record de la periode.",
    passationService: "Preparer un renfort comptoir pour mardi matin.",
    observationGeneral:
      "Le pre-appel des clients professionnels a fluidifie les remises.",
    createdAt: "2026-05-04T18:25:00.000Z",
  },
  {
    reportDate: "2026-05-05",
    personnelPresent: "Fatou Sow, Khady Gueye, Mariama Diallo",
    personnelAbsent: "Abdoulaye Faye (renfort piste)",
    ambianceGenerale: "Service plus serein apres la pointe de reprise.",
    problemesRencontres:
      "Une attente sur procuration originale a bloque une remise entreprise.",
    etatGeneralService: "87 retraits clotures et 3 dossiers ajournes.",
    passationService:
      "Relancer le client entreprise REP-505 pour depot de procuration valide.",
    observationGeneral:
      "La nouvelle organisation des files differentielles est efficace.",
    createdAt: "2026-05-05T18:08:00.000Z",
  },
];

export const SEED_DAILY_GENERAL_REPORTS: SeedDailyGeneralReportDefinition[] = [
  ...buildServiceReports("group_envoi", "leader_envoi", ENVOI_REPORTS),
  ...buildServiceReports("group_piste", "leader_piste", PISTE_REPORTS),
  ...buildServiceReports("group_retrait", "leader_retrait", RETRAIT_REPORTS),
];

export const SEED_COLIS_NON_VUS: SeedColisNonVuDefinition[] = [
  {
    reportDate: "2026-04-21",
    service: "envoi",
    immatriculation: "DK-4215-AB",
    agenceDepart: "Thies",
    description:
      "Colis textile annonce disponible mais non localise au comptoir 2.",
    destinataire: "Mame Diarra Fall",
    actionMenee:
      "Recherche lancee avec la piste et blocage de remise jusqu'a confirmation.",
    reportedByKey: "leader_envoi",
    createdAt: "2026-04-21T11:45:00.000Z",
  },
  {
    reportDate: "2026-04-27",
    service: "envoi",
    immatriculation: "DK-5084-CD",
    agenceDepart: "Mbour",
    description:
      "Colis cosmetique scanne a l'arrivee mais absent du rack de retrait rapide.",
    destinataire: "Aminata Cisse",
    actionMenee:
      "Controle croise des scans et inspection de la palette mixte du matin.",
    reportedByKey: "leader_envoi",
    createdAt: "2026-04-27T16:10:00.000Z",
  },
  {
    reportDate: "2026-05-04",
    service: "piste",
    destination: "Mbour",
    provenance: "Hub Dakar",
    description:
      "Trois colis de pieces auto annonces sur palette PMB-04 mais non vus au dechargement immediat.",
    personnesContactees:
      "Palette reouverte, colis retrouves sur un sous-lot standard avant cloture.",
    reportedByKey: "leader_piste",
    createdAt: "2026-05-04T10:18:00.000Z",
  },
  {
    reportDate: "2026-05-05",
    service: "envoi",
    immatriculation: "DK-7301-IJ",
    agenceDepart: "Richard-Toll",
    description:
      "Colis outillage annonce la veille sans mise en rayon au comptoir entreprise.",
    destinataire: "Societe Sahel BTP",
    actionMenee:
      "Recherche maintenue avec verification des racks societes et appel agence depart.",
    reportedByKey: "leader_envoi",
    createdAt: "2026-05-05T12:02:00.000Z",
  },
];

export const SEED_COLIS_HORS_BORDEREAU: SeedColisHorsBordereauDefinition[] = [
  {
    reportDate: "2026-04-21",
    agenceDepart: "Saint-Louis",
    description:
      "Colis fragile retrouve sur palette piste sans mention sur bordereau.",
    destinataire: "Khadim Ndiaye",
    destinatairePhone: "+221770000401",
    actionMenee:
      "Appel agence depart, ajout manuel au manifeste et photo archivee.",
    reportedByKey: "leader_retrait",
    createdAt: "2026-04-21T12:40:00.000Z",
  },
  {
    reportDate: "2026-04-30",
    agenceDepart: "Matam",
    description:
      "Sac documentaire recu avec le lot de fin de mois mais absent du bordereau physique.",
    destinataire: "Agence Dakar Centre",
    destinatairePhone: "+221770000402",
    actionMenee:
      "Ecarts documentes et regularisation demandee avant cloture de reception.",
    reportedByKey: "leader_retrait",
    createdAt: "2026-04-30T11:25:00.000Z",
  },
  {
    reportDate: "2026-05-05",
    agenceDepart: "Richard-Toll",
    description:
      "Carton de pieces hydrauliques trouve dans le couloir piste sans bordereau joint.",
    destinataire: "Sahel Pompes",
    destinatairePhone: "+221770000404",
    actionMenee:
      "Emission d'un bordereau complementaire puis reintegration du lot.",
    reportedByKey: "leader_retrait",
    createdAt: "2026-05-05T09:50:00.000Z",
  },
];

export const SEED_ERREURS_DESTINATION: SeedErreurDestinationDefinition[] = [
  {
    reportDate: "2026-04-22",
    nom: "Boutique Safa",
    telephone: "+221770000501",
    description:
      "Un colis textile a ete ventile vers le couloir Touba avant correction.",
    destinataire: "Boutique Safa",
    equipeFacturation: "Equipe matinale piste",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-22T10:05:00.000Z",
  },
  {
    reportDate: "2026-04-28",
    nom: "Quincaillerie du Centre",
    telephone: "+221770000502",
    description:
      "Colis de quincaillerie dirige a tort vers Touba sur le premier scan.",
    destinataire: "Quincaillerie du Centre",
    equipeFacturation: "Equipe de ventilation zone est",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-28T09:40:00.000Z",
  },
  {
    reportDate: "2026-05-04",
    immatriculation: "DK-7772-OP",
    destination: "Ziguinchor",
    description:
      "Un lot express a ete pointe sur le couloir standard en reprise post-ferie.",
    destinationPrevue: "Ziguinchor",
    destinationErronee: "Kaolack",
    telephone: "+221770000503",
    reportedByKey: "leader_retrait",
    createdAt: "2026-05-04T15:14:00.000Z",
  },
];

export const SEED_COLIS_RETARDES: SeedColisRetardeDefinition[] = [
  {
    reportDate: "2026-04-22",
    codeColis: "AWB-RT-2219",
    description:
      "Colis pharmaceutique attendu en retrait mais encore en transit depuis Ziguinchor.",
    destinataire: "Pharmacie Medina",
    motifRetard: "Retard de rotation vehicule sur l'axe sud.",
    actionEnCours: "Client informe, suivi maintenu avec l'agence d'origine.",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-22T15:00:00.000Z",
  },
  {
    reportDate: "2026-04-29",
    codeColis: "AWB-RT-2918",
    description: "Colis informatique non disponible au comptoir entreprise.",
    destinataire: "Digital Services Dakar",
    motifRetard: "Arrivee tardive de la navette Ziguinchor.",
    actionEnCours:
      "Notification SMS manuelle et suivi prioritaire au dechargement suivant.",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-29T17:04:00.000Z",
  },
  {
    reportDate: "2026-05-04",
    codeColis: "AWB-RT-4021",
    description:
      "Colis alimentaire en attente de tri final apres retour de ferie.",
    destinataire: "Restaurant Le Baobab",
    motifRetard: "Afflux exceptionnel a la reprise du trafic.",
    actionEnCours:
      "Priorisation demandee a la piste pour mise a disposition mardi matin.",
    reportedByKey: "leader_piste",
    createdAt: "2026-05-04T17:02:00.000Z",
  },
  {
    reportDate: "2026-05-05",
    codeColis: "AWB-RT-5059",
    description:
      "Colis agricole signale encore en attente de dechargement complet.",
    destinataire: "Cooperative Niani",
    motifRetard: "Comptage contradictoire sur le transfert du matin.",
    actionEnCours: "Client prevenu et dossier maintenu en priorite 1.",
    reportedByKey: "leader_piste",
    createdAt: "2026-05-05T14:20:00.000Z",
  },
];

export const SEED_COLIS_NON_IDENTIFIES: SeedColisNonIdentifieDefinition[] = [
  {
    reportDate: "2026-04-23",
    descriptionColis:
      "Carton brun moyen format, ruban transparent, sans etiquette lisible.",
    motifNonIdentification:
      "Code-barres deteriore et absence de fiche d'expedition visible.",
    actionMenee:
      "Mise en quarantaine documentaire avec photos et ouverture du dossier PN-423.",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-23T10:42:00.000Z",
  },
  {
    reportDate: "2026-04-29",
    descriptionColis:
      "Sac souple noir contenant fournitures bureautiques, cachet agence partiel.",
    motifNonIdentification: "Pochette code-barres absente a la reception.",
    actionMenee:
      "Reconstitution du dossier via cachet et contact agence Thies.",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-29T08:35:00.000Z",
  },
  {
    reportDate: "2026-05-04",
    descriptionColis:
      "Bac plastique gris contenant pieces auto melangees a un lot standard.",
    motifNonIdentification: "Palette mixte mal marquee a l'arrivee.",
    actionMenee:
      "Isolement du bac et rapprochement avec la fiche de chargement Mbour.",
    reportedByKey: "leader_piste",
    createdAt: "2026-05-04T11:10:00.000Z",
  },
];

export const SEED_COLIS_TRANSFERES: SeedColisTransfereDefinition[] = [
  {
    reportDate: "2026-04-22",
    destination: "Kaolack",
    numeroBordereau: "TRF-2204",
    nombreColis: 26,
    chauffeur: "Ousmane Kane",
    statut: "Parti a 19h10, arrivee confirmee le lendemain.",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-22T19:15:00.000Z",
  },
  {
    reportDate: "2026-04-30",
    destination: "Touba",
    numeroBordereau: "TRF-300",
    nombreColis: 41,
    chauffeur: "Aliou Sarr",
    statut: "Charge complet et scelle avant fermeture mensuelle.",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-30T19:35:00.000Z",
  },
  {
    reportDate: "2026-05-04",
    destination: "Kaolack",
    numeroBordereau: "TRF-404",
    nombreColis: 38,
    chauffeur: "Aliou Sarr",
    statut: "Depart retarde par panne scanner puis stabilise.",
    reportedByKey: "leader_piste",
    createdAt: "2026-05-04T19:20:00.000Z",
  },
  {
    reportDate: "2026-05-05",
    destination: "Touba",
    numeroBordereau: "TRF-505",
    nombreColis: 34,
    chauffeur: "Ousmane Kane",
    statut: "Comptage contradictoire effectue puis expedition validee.",
    reportedByKey: "leader_piste",
    createdAt: "2026-05-05T19:05:00.000Z",
  },
];

export const SEED_CONVOYEURS_ABSENTS: SeedConvoyeurAbsentDefinition[] = [
  {
    reportDate: "2026-04-23",
    nom: "Bocar Dieng",
    numero: "+221770000601",
    vehicule: "DK-9001-TR",
    agenceProvenance: "Louga",
    userKey: null,
    reportedByKey: "leader_envoi",
    createdAt: "2026-04-23T07:20:00.000Z",
  },
  {
    reportDate: "2026-04-28",
    nom: "Ousmane Kane",
    numero: "+221700000201",
    vehicule: "DK-9102-TR",
    agenceProvenance: "Kolda",
    userKey: "convoyeur_ousmane",
    reportedByKey: "leader_envoi",
    createdAt: "2026-04-28T06:55:00.000Z",
  },
  {
    reportDate: "2026-05-01",
    nom: "Aliou Sarr",
    numero: "+221700000203",
    vehicule: "DK-9203-TR",
    agenceProvenance: "Touba",
    userKey: "convoyeur_aliou",
    reportedByKey: "leader_envoi",
    createdAt: "2026-05-01T08:30:00.000Z",
  },
];

export const SEED_BORDEREAUX_NON_CONFORMES: SeedBordereauNonConformeDefinition[] =
  [
    {
      reportDate: "2026-04-21",
      numeroBordereau: "E-214",
      motifNonConformite:
        "Nombre de colis annonce absent de la colonne detail et cachet manquant.",
      actionMenee:
        "Regularisation immediate avec l'agence emettrice avant depart du lot.",
      reportedByKey: "leader_envoi",
      createdAt: "2026-04-21T07:55:00.000Z",
    },
    {
      reportDate: "2026-04-30",
      numeroBordereau: "MAT-430",
      motifNonConformite:
        "Ecart entre quantite physique recue et total bordereau.",
      actionMenee: "Controle contradictoire et correction signee par la piste.",
      reportedByKey: "leader_envoi",
      createdAt: "2026-04-30T10:18:00.000Z",
    },
    {
      reportDate: "2026-05-05",
      numeroBordereau: "HT-505",
      motifNonConformite:
        "Reference hors bordereau sur un carton de pieces hydrauliques.",
      actionMenee:
        "Creation d'un bordereau complementaire et reintegration du lot.",
      reportedByKey: "leader_envoi",
      createdAt: "2026-05-05T10:05:00.000Z",
    },
  ];

export const SEED_VEHICULES_EMBARQUES: SeedVehiculeEmbarqueDefinition[] = [
  {
    reportDate: "2026-04-22",
    immatriculation: "DK-3301-AA",
    destination: "Kaolack",
    heure: "2026-04-22T19:10:00.000Z",
    retourReceptionColis:
      "Reception colis bouclee a 18h40, fermeture quai validee.",
    presenceConvoyeurs:
      "Ousmane Kane present et depart confirme par le poste central.",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-22T19:18:00.000Z",
  },
  {
    reportDate: "2026-04-24",
    immatriculation: "DK-3302-BB",
    destination: "Matam",
    heure: "2026-04-24T20:05:00.000Z",
    retourReceptionColis:
      "Chargement finalise sans reliquat apres controle export.",
    presenceConvoyeurs: "Aliou Sarr present, signature recue avant sortie.",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-24T20:15:00.000Z",
  },
  {
    reportDate: "2026-04-28",
    immatriculation: "DK-3303-CC",
    destination: "Kolda",
    heure: "2026-04-28T20:30:00.000Z",
    retourReceptionColis:
      "Depart differe a cause de l'absence convoyeur en debut de poste.",
    presenceConvoyeurs: "Aliou Sarr a assure le convoyage de rattrapage.",
    reportedByKey: "leader_piste",
    createdAt: "2026-04-28T20:36:00.000Z",
  },
  {
    reportDate: "2026-05-04",
    immatriculation: "DK-3305-EE",
    destination: "Kaolack",
    heure: "2026-05-04T19:20:00.000Z",
    retourReceptionColis:
      "Depart maintenu apres remplacement du scanner de quai.",
    presenceConvoyeurs:
      "Aliou Sarr et convoyeur adjoint presents au point de sortie.",
    reportedByKey: "leader_piste",
    createdAt: "2026-05-04T19:28:00.000Z",
  },
  {
    reportDate: "2026-05-05",
    immatriculation: "DK-3306-FF",
    destination: "Touba",
    heure: "2026-05-05T19:05:00.000Z",
    retourReceptionColis:
      "Comptage contradictoire boucle avant fermeture du quai.",
    presenceConvoyeurs: "Ousmane Kane present et bordereau signe avant depart.",
    reportedByKey: "leader_piste",
    createdAt: "2026-05-05T19:11:00.000Z",
  },
];

export const SEED_SIGNATURE_LOGS: SeedSignatureLogDefinition[] = [
  {
    slipNumber: "SLIP-2204-01",
    busArrivalTime: "2026-04-22T18:55:00.000Z",
    signedAt: "2026-04-22T19:14:00.000Z",
    userKey: "convoyeur_ousmane",
  },
  {
    slipNumber: "SLIP-2204-02",
    busArrivalTime: "2026-04-22T18:55:00.000Z",
    signedAt: "2026-04-22T19:16:00.000Z",
    userKey: "leader_envoi",
  },
  {
    slipNumber: "SLIP-2404-01",
    busArrivalTime: "2026-04-24T19:46:00.000Z",
    signedAt: "2026-04-24T20:10:00.000Z",
    userKey: "convoyeur_aliou",
  },
  {
    slipNumber: "SLIP-2804-01",
    busArrivalTime: "2026-04-28T20:08:00.000Z",
    signedAt: "2026-04-28T20:32:00.000Z",
    userKey: "convoyeur_aliou",
  },
  {
    slipNumber: "SLIP-3004-01",
    busArrivalTime: "2026-04-30T19:20:00.000Z",
    signedAt: "2026-04-30T19:38:00.000Z",
    userKey: "convoyeur_aliou",
  },
  {
    slipNumber: "SLIP-0405-01",
    busArrivalTime: "2026-05-04T19:02:00.000Z",
    signedAt: "2026-05-04T19:22:00.000Z",
    userKey: "convoyeur_aliou",
  },
  {
    slipNumber: "SLIP-0505-01",
    busArrivalTime: "2026-05-05T18:48:00.000Z",
    signedAt: "2026-05-05T19:08:00.000Z",
    userKey: "convoyeur_ousmane",
  },
];

export const SEED_PERSONNEL_EVALUATIONS: SeedPersonnelEvaluationDefinition[] = [
  {
    evaluationDate: "2026-04-20",
    userKey: "agent_abdoulaye",
    criteriaKey: "ponctualite",
    weightOverride: null,
    notes: "Arrivee anticipee et prise en main rapide du quai des 06h00.",
    recordedByKey: "leader_envoi",
    createdAt: "2026-04-20T08:20:00.000Z",
  },
  {
    evaluationDate: "2026-04-20",
    userKey: "agent_mariama",
    criteriaKey: "qualite_tri",
    weightOverride: "2.50",
    notes: "Tri propre et sans erreur sur la zone Saint-Louis.",
    recordedByKey: "leader_piste",
    createdAt: "2026-04-20T13:18:00.000Z",
  },
  {
    evaluationDate: "2026-04-21",
    userKey: "agent_khady",
    criteriaKey: "relation_client",
    weightOverride: null,
    notes:
      "Bonne gestion des reclamations au comptoir et explications claires aux clients.",
    recordedByKey: "leader_retrait",
    createdAt: "2026-04-21T18:20:00.000Z",
  },
  {
    evaluationDate: "2026-04-22",
    userKey: "agent_ibrahima",
    criteriaKey: "initiative",
    weightOverride: "2.00",
    notes:
      "A identifie et corrige l'erreur de ventilation vers Thies avant depart.",
    recordedByKey: "leader_piste",
    createdAt: "2026-04-22T13:22:00.000Z",
  },
  {
    evaluationDate: "2026-04-22",
    userKey: "agent_abdoulaye",
    criteriaKey: "productivite",
    weightOverride: null,
    notes: "Bonne tenue sur le chargement des transferts inter-agences.",
    recordedByKey: "leader_envoi",
    createdAt: "2026-04-22T08:24:00.000Z",
  },
  {
    evaluationDate: "2026-04-24",
    userKey: "agent_khady",
    criteriaKey: "productivite",
    weightOverride: "2.25",
    notes:
      "A absorbe la pointe comptoir de fin de semaine avec un temps d'attente reduit.",
    recordedByKey: "leader_retrait",
    createdAt: "2026-04-24T18:22:00.000Z",
  },
  {
    evaluationDate: "2026-04-27",
    userKey: "agent_abdoulaye",
    criteriaKey: "cooperation",
    weightOverride: null,
    notes: "Renfort apporte au retrait pendant la reprise de semaine.",
    recordedByKey: "leader_retrait",
    createdAt: "2026-04-27T18:12:00.000Z",
  },
  {
    evaluationDate: "2026-04-28",
    userKey: "convoyeur_ousmane",
    criteriaKey: "absence_non_justifiee",
    weightOverride: null,
    notes:
      "Absence signalee tardivement ayant retarde le depart de la tournee Kolda.",
    recordedByKey: "leader_envoi",
    createdAt: "2026-04-28T09:00:00.000Z",
  },
  {
    evaluationDate: "2026-04-28",
    userKey: "agent_ibrahima",
    criteriaKey: "erreur_destination",
    weightOverride: "-2.00",
    notes:
      "Erreur de premier scan corrigee sans impact client mais necessitant un rappel procedure.",
    recordedByKey: "leader_piste",
    createdAt: "2026-04-28T13:24:00.000Z",
  },
  {
    evaluationDate: "2026-04-30",
    userKey: "agent_abdoulaye",
    criteriaKey: "productivite",
    weightOverride: "2.75",
    notes:
      "Tres forte implication sur la journee de fin de mois et le transfert supplementaire.",
    recordedByKey: "leader_envoi",
    createdAt: "2026-04-30T08:34:00.000Z",
  },
  {
    evaluationDate: "2026-04-30",
    userKey: "agent_mariama",
    criteriaKey: "bordereau_incomplet",
    weightOverride: "-1.50",
    notes:
      "Un ecart documentaire a necessite une regularisation en reception Matam.",
    recordedByKey: "leader_piste",
    createdAt: "2026-04-30T13:30:00.000Z",
  },
  {
    evaluationDate: "2026-05-01",
    userKey: "agent_khady",
    criteriaKey: "cooperation",
    weightOverride: null,
    notes:
      "A maintenu un accueil efficace pendant la plage reduite du jour ferie.",
    recordedByKey: "leader_retrait",
    createdAt: "2026-05-01T14:10:00.000Z",
  },
  {
    evaluationDate: "2026-05-04",
    userKey: "agent_abdoulaye",
    criteriaKey: "initiative",
    weightOverride: "2.25",
    notes:
      "A bascule vers la saisie manuelle pendant la panne du scanner sans bloquer le quai.",
    recordedByKey: "leader_envoi",
    createdAt: "2026-05-04T08:34:00.000Z",
  },
  {
    evaluationDate: "2026-05-04",
    userKey: "agent_ibrahima",
    criteriaKey: "qualite_tri",
    weightOverride: null,
    notes: "Reclassement propre de la palette mixte de reprise ferie.",
    recordedByKey: "leader_piste",
    createdAt: "2026-05-04T13:34:00.000Z",
  },
  {
    evaluationDate: "2026-05-04",
    userKey: "agent_khady",
    criteriaKey: "productivite",
    weightOverride: "3.00",
    notes: "A tenu la pointe de 111 retraits avec une bonne gestion des files.",
    recordedByKey: "leader_retrait",
    createdAt: "2026-05-04T18:28:00.000Z",
  },
  {
    evaluationDate: "2026-05-05",
    userKey: "convoyeur_ousmane",
    criteriaKey: "ponctualite",
    weightOverride: null,
    notes:
      "Depart du transfert Touba prepare a l'heure apres le comptage contradictoire.",
    recordedByKey: "leader_envoi",
    createdAt: "2026-05-05T19:12:00.000Z",
  },
  {
    evaluationDate: "2026-05-05",
    userKey: "agent_mariama",
    criteriaKey: "initiative",
    weightOverride: null,
    notes: "A regularise rapidement le dossier hors bordereau HT-505.",
    recordedByKey: "leader_piste",
    createdAt: "2026-05-05T13:18:00.000Z",
  },
  {
    evaluationDate: "2026-05-05",
    userKey: "agent_khady",
    criteriaKey: "transmission_tardive",
    weightOverride: "-0.50",
    notes:
      "Compte rendu de procuration entreprise remonte tardivement en fin de vacation.",
    recordedByKey: "leader_retrait",
    createdAt: "2026-05-05T18:16:00.000Z",
  },
];
