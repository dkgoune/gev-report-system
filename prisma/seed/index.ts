import "dotenv/config";
import { scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import {
  getSeedUsers,
  SEED_GROUPS,
  SEED_ATTENDANCE_CRITERION_SETTINGS,
  SEED_BORDEREAUX_NON_CONFORMES,
  SEED_COLIS_HORS_BORDEREAU,
  SEED_COLIS_NON_IDENTIFIES,
  SEED_COLIS_NON_VUS,
  SEED_COLIS_RETARDES,
  SEED_COLIS_TRANSFERES,
  SEED_CONVOYEURS_ABSENTS,
  SEED_CRITERIA,
  SEED_DAILY_GENERAL_REPORTS,
  SEED_ERREURS_DESTINATION,
  SEED_PERSONNEL_EVALUATIONS,
  SEED_SIGNATURE_LOGS,
  SEED_VEHICULES_EMBARQUES,
  type RootSeedConfig,
} from "./data";

const SCRYPT_KEYLEN = 64;

function readRootConfig(): RootSeedConfig {
  return {
    username: process.env.ROOT_USERNAME || "root",
    password: process.env.ROOT_PASSWORD || "root1234",
    fullName: process.env.ROOT_FULL_NAME || "Root User",
  };
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateTime(value: string): Date {
  return new Date(value);
}

function hashSeedPassword(password: string, saltSource: string): string {
  const salt = `seed-${saltSource}`;
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function getRequiredId(
  store: Map<string, { id: string }>,
  key: string,
  label: string
): string {
  const item = store.get(key);

  if (!item) {
    throw new Error(`Missing seed reference for ${label}: ${key}`);
  }

  return item.id;
}

function assertUniqueUsernames(usernames: string[]) {
  if (new Set(usernames).size !== usernames.length) {
    throw new Error("Seed user definitions contain duplicate usernames.");
  }
}

function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export async function runSeed() {
  const prisma = createClient();
  const rootConfig = readRootConfig();
  const userDefinitions = getSeedUsers(rootConfig);
  const groupServiceByKey = new Map(
    SEED_GROUPS.map(group => [group.key, group.service])
  );
  const groupKeyByService = new Map(
    SEED_GROUPS.map(group => [group.service, group.key])
  );
  const userGroupKeyByKey = new Map(
    userDefinitions.map(user => [user.key, user.groupKey])
  );

  assertUniqueUsernames(userDefinitions.map(user => user.username));

  console.log("[seed] Resetting and loading deterministic sample data...");

  try {
    await prisma.$transaction([
      prisma.personnelEvaluation.deleteMany(),
      prisma.attendanceCriterionSetting.deleteMany(),
      prisma.criterion.deleteMany(),
      prisma.signatureLog.deleteMany(),
      prisma.vehiculeEmbarque.deleteMany(),
      prisma.bordereauNonConforme.deleteMany(),
      prisma.convoyeurAbsent.deleteMany(),
      prisma.colisTransfere.deleteMany(),
      prisma.colisNonIdentifie.deleteMany(),
      prisma.colisRetarde.deleteMany(),
      prisma.erreurDestination.deleteMany(),
      prisma.colisHorsBordereau.deleteMany(),
      prisma.colisNonVu.deleteMany(),
      prisma.dailyGeneralReport.deleteMany(),
      prisma.group.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    await prisma.user.createMany({
      data: userDefinitions.map(user => ({
        fullName: user.fullName,
        username: user.username,
        password: hashSeedPassword(user.password, user.username),
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      })),
    });

    const createdUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
      },
    });

    const usersByUsername = new Map(
      createdUsers.map(user => [user.username, { id: user.id }])
    );
    const userIdsByKey = new Map<string, { id: string }>();

    for (const user of userDefinitions) {
      const createdUser = usersByUsername.get(user.username);

      if (!createdUser) {
        throw new Error(`Seed user '${user.username}' was not created.`);
      }

      userIdsByKey.set(user.key, createdUser);
    }

    await prisma.group.createMany({
      data: SEED_GROUPS.map(group => ({
        name: group.name,
        service: group.service,
        isActive: group.isActive,
      })),
    });

    const createdGroups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        service: true,
      },
    });

    const groupsBySignature = new Map(
      createdGroups.map(group => [
        `${group.name}:${group.service}`,
        { id: group.id },
      ])
    );
    const groupIdsByKey = new Map<string, { id: string }>();

    for (const group of SEED_GROUPS) {
      const createdGroup = groupsBySignature.get(
        `${group.name}:${group.service}`
      );

      if (!createdGroup) {
        throw new Error(`Seed group '${group.name}' was not created.`);
      }

      groupIdsByKey.set(group.key, createdGroup);
    }

    await Promise.all(
      userDefinitions
        .filter(user => user.groupKey)
        .map(user =>
          prisma.user.update({
            where: { id: getRequiredId(userIdsByKey, user.key, "group user") },
            data: {
              groupId: getRequiredId(
                groupIdsByKey,
                user.groupKey as string,
                "user group"
              ),
            },
          })
        )
    );

    await prisma.criterion.createMany({
      data: SEED_CRITERIA.map(criterion => ({
        name: criterion.name,
        impact: criterion.impact,
        defaultWeight: criterion.defaultWeight,
        maxDaily: criterion.maxDaily,
        isActive: criterion.isActive,
        createdById: getRequiredId(userIdsByKey, "root", "criterion creator"),
      })),
    });

    const createdCriteria = await prisma.criterion.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const criteriaByName = new Map(
      createdCriteria.map(criterion => [criterion.name, { id: criterion.id }])
    );
    const criterionIdsByKey = new Map<string, { id: string }>();

    for (const criterion of SEED_CRITERIA) {
      const createdCriterion = criteriaByName.get(criterion.name);

      if (!createdCriterion) {
        throw new Error(`Seed criterion '${criterion.name}' was not created.`);
      }

      criterionIdsByKey.set(criterion.key, createdCriterion);
    }

    await prisma.attendanceCriterionSetting.createMany({
      data: SEED_ATTENDANCE_CRITERION_SETTINGS.map(setting => ({
        criterionId: getRequiredId(
          criterionIdsByKey,
          setting.criterionKey,
          "attendance criterion"
        ),
        status: setting.status,
        createdById: getRequiredId(
          userIdsByKey,
          "root",
          "attendance setting creator"
        ),
      })),
    });

    await prisma.dailyGeneralReport.createMany({
      data: SEED_DAILY_GENERAL_REPORTS.map(report => ({
        groupId: getRequiredId(
          groupIdsByKey,
          report.groupKey,
          "daily report group"
        ),
        reportDate: toDateOnly(report.reportDate),
        service:
          groupServiceByKey.get(report.groupKey) ??
          (() => {
            throw new Error(
              `Missing service for report group: ${report.groupKey}`
            );
          })(),
        personnelPresent: report.personnelPresent,
        personnelAbsent: report.personnelAbsent,
        ambianceGenerale: report.ambianceGenerale,
        problemesRencontres: report.problemesRencontres,
        etatGeneralService: report.etatGeneralService,
        passationService: report.passationService,
        observationGeneral: report.observationGeneral,
        createdAt: toDateTime(report.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          report.reportedByKey,
          "daily report reporter"
        ),
      })),
    });

    const dailyReports = await prisma.dailyGeneralReport.findMany({
      select: {
        id: true,
        groupId: true,
        reportDate: true,
        service: true,
      },
    });

    const dailyReportIdsBySignature = new Map(
      dailyReports.map(report => [
        `${toDateKey(report.reportDate)}:${report.groupId}`,
        report.id,
      ])
    );

    const getGeneralReportId = (
      reportDate: string,
      groupKey: string | null | undefined
    ) => {
      if (!groupKey) {
        return null;
      }

      const groupId = groupIdsByKey.get(groupKey)?.id;

      if (!groupId) {
        return null;
      }

      return dailyReportIdsBySignature.get(`${reportDate}:${groupId}`) ?? null;
    };

    await prisma.colisNonVu.createMany({
      data: SEED_COLIS_NON_VUS.map(record => ({
        reportDate: toDateOnly(record.reportDate),
        service: record.service,
        destination: record.destination ?? null,
        provenance: record.provenance ?? null,
        personnesContactees: record.personnesContactees ?? null,
        immatriculation: record.immatriculation ?? null,
        agenceDepart: record.agenceDepart,
        description: record.description,
        destinataire: record.destinataire ?? null,
        actionMenee: record.actionMenee ?? null,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "colis non vu reporter"
        ),
        generalReportId: getGeneralReportId(
          record.reportDate,
          groupKeyByService.get(record.service) ?? null
        ),
      })),
    });

    await prisma.colisHorsBordereau.createMany({
      data: SEED_COLIS_HORS_BORDEREAU.map(record => ({
        reportDate: toDateOnly(record.reportDate),
        agenceDepart: record.agenceDepart,
        description: record.description,
        destinataire: record.destinataire,
        destinatairePhone: record.destinatairePhone,
        actionMenee: record.actionMenee,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "hors bordereau reporter"
        ),
        generalReportId: getGeneralReportId(
          record.reportDate,
          userGroupKeyByKey.get(record.reportedByKey) ?? null
        ),
      })),
    });

    await prisma.erreurDestination.createMany({
      data: SEED_ERREURS_DESTINATION.map(record => ({
        reportDate: toDateOnly(record.reportDate),
        nom: record.nom ?? null,
        telephone: record.telephone ?? null,
        destinataire: record.destinataire ?? null,
        equipeFacturation: record.equipeFacturation ?? null,
        immatriculation: record.immatriculation ?? null,
        destination: record.destination ?? null,
        description: record.description,
        destinationPrevue: record.destinationPrevue ?? null,
        destinationErronee: record.destinationErronee ?? null,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "erreur destination reporter"
        ),
        generalReportId: getGeneralReportId(
          record.reportDate,
          userGroupKeyByKey.get(record.reportedByKey) ?? null
        ),
      })),
    });

    await prisma.colisRetarde.createMany({
      data: SEED_COLIS_RETARDES.map(record => ({
        reportDate: toDateOnly(record.reportDate),
        codeColis: record.codeColis,
        description: record.description,
        destinataire: record.destinataire,
        motifRetard: record.motifRetard,
        actionEnCours: record.actionEnCours,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "colis retarde reporter"
        ),
        generalReportId: getGeneralReportId(
          record.reportDate,
          userGroupKeyByKey.get(record.reportedByKey) ?? null
        ),
      })),
    });

    await prisma.colisNonIdentifie.createMany({
      data: SEED_COLIS_NON_IDENTIFIES.map(record => ({
        reportDate: toDateOnly(record.reportDate),
        descriptionColis: record.descriptionColis,
        motifNonIdentification: record.motifNonIdentification,
        actionMenee: record.actionMenee,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "colis non identifie reporter"
        ),
        generalReportId: getGeneralReportId(
          record.reportDate,
          userGroupKeyByKey.get(record.reportedByKey) ?? null
        ),
      })),
    });

    await prisma.colisTransfere.createMany({
      data: SEED_COLIS_TRANSFERES.map(record => ({
        reportDate: toDateOnly(record.reportDate),
        destination: record.destination,
        numeroBordereau: record.numeroBordereau,
        nombreColis: record.nombreColis,
        chauffeur: record.chauffeur,
        statut: record.statut,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "colis transfere reporter"
        ),
        generalReportId: getGeneralReportId(
          record.reportDate,
          userGroupKeyByKey.get(record.reportedByKey) ?? null
        ),
      })),
    });

    await prisma.convoyeurAbsent.createMany({
      data: SEED_CONVOYEURS_ABSENTS.map(record => ({
        reportDate: toDateOnly(record.reportDate),
        nom: record.nom,
        numero: record.numero,
        vehicule: record.vehicule,
        agenceProvenance: record.agenceProvenance,
        createdAt: toDateTime(record.createdAt),
        userId: record.userKey
          ? getRequiredId(userIdsByKey, record.userKey, "absent convoyeur")
          : null,
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "convoyeur absent reporter"
        ),
        generalReportId: getGeneralReportId(
          record.reportDate,
          userGroupKeyByKey.get(record.reportedByKey) ?? null
        ),
      })),
    });

    await prisma.bordereauNonConforme.createMany({
      data: SEED_BORDEREAUX_NON_CONFORMES.map(record => ({
        reportDate: toDateOnly(record.reportDate),
        numeroBordereau: record.numeroBordereau,
        motifNonConformite: record.motifNonConformite,
        actionMenee: record.actionMenee,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "bordereau reporter"
        ),
        generalReportId: getGeneralReportId(
          record.reportDate,
          userGroupKeyByKey.get(record.reportedByKey) ?? null
        ),
      })),
    });

    await prisma.vehiculeEmbarque.createMany({
      data: SEED_VEHICULES_EMBARQUES.map(record => ({
        reportDate: toDateOnly(record.reportDate),
        immatriculation: record.immatriculation,
        destination: record.destination,
        heure: toDateTime(record.heure),
        retourReceptionColis: record.retourReceptionColis,
        presenceConvoyeurs: record.presenceConvoyeurs,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "vehicule embarque reporter"
        ),
        generalReportId: getGeneralReportId(
          record.reportDate,
          userGroupKeyByKey.get(record.reportedByKey) ?? null
        ),
      })),
    });

    await prisma.signatureLog.createMany({
      data: SEED_SIGNATURE_LOGS.map(record => ({
        slipNumber: record.slipNumber,
        busArrivalTime: record.busArrivalTime
          ? toDateTime(record.busArrivalTime)
          : null,
        groupId: getRequiredId(
          groupIdsByKey,
          record.groupKey,
          "signature group"
        ),
        signedAt: toDateTime(record.signedAt),
        userId: getRequiredId(userIdsByKey, record.userKey, "signature user"),
      })),
    });

    await prisma.personnelEvaluation.createMany({
      data: SEED_PERSONNEL_EVALUATIONS.map(record => ({
        evaluationDate: toDateOnly(record.evaluationDate),
        weightOverride: record.weightOverride,
        notes: record.notes,
        createdAt: toDateTime(record.createdAt),
        userId: getRequiredId(userIdsByKey, record.userKey, "evaluation user"),
        criteriaId: getRequiredId(
          criterionIdsByKey,
          record.criteriaKey,
          "evaluation criterion"
        ),
        recordedById: getRequiredId(
          userIdsByKey,
          record.recordedByKey,
          "evaluation recorder"
        ),
      })),
    });

    console.log(
      `[seed] Created ${userDefinitions.length} users, ${SEED_CRITERIA.length} criteria, ${SEED_ATTENDANCE_CRITERION_SETTINGS.length} attendance settings, ${SEED_DAILY_GENERAL_REPORTS.length} daily reports, ${SEED_SIGNATURE_LOGS.length} signatures, and ${SEED_PERSONNEL_EVALUATIONS.length} evaluations.`
    );
    console.log("[seed] Deterministic sample dataset loaded successfully.");
  } finally {
    await prisma.$disconnect();
  }
}
