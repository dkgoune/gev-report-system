import "dotenv/config";
import { scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import {
  getSeedUsers,
  SEED_BORDEREAUX_NON_CONFORMES,
  SEED_CLASSEMENT_COLIS,
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
  label: string,
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

export async function runSeed() {
  const prisma = createClient();
  const rootConfig = readRootConfig();
  const userDefinitions = getSeedUsers(rootConfig);

  assertUniqueUsernames(userDefinitions.map((user) => user.username));

  console.log("[seed] Resetting and loading deterministic sample data...");

  try {
    await prisma.$transaction([
      prisma.personnelEvaluation.deleteMany(),
      prisma.criterion.deleteMany(),
      prisma.signatureLog.deleteMany(),
      prisma.vehiculeEmbarque.deleteMany(),
      prisma.bordereauNonConforme.deleteMany(),
      prisma.convoyeurAbsent.deleteMany(),
      prisma.classementColi.deleteMany(),
      prisma.colisTransfere.deleteMany(),
      prisma.colisNonIdentifie.deleteMany(),
      prisma.colisRetarde.deleteMany(),
      prisma.erreurDestination.deleteMany(),
      prisma.colisHorsBordereau.deleteMany(),
      prisma.colisNonVu.deleteMany(),
      prisma.dailyGeneralReport.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    await prisma.user.createMany({
      data: userDefinitions.map((user) => ({
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
      createdUsers.map((user) => [user.username, { id: user.id }]),
    );
    const userIdsByKey = new Map<string, { id: string }>();

    for (const user of userDefinitions) {
      const createdUser = usersByUsername.get(user.username);

      if (!createdUser) {
        throw new Error(`Seed user '${user.username}' was not created.`);
      }

      userIdsByKey.set(user.key, createdUser);
    }

    await prisma.criterion.createMany({
      data: SEED_CRITERIA.map((criterion) => ({
        name: criterion.name,
        impact: criterion.impact,
        defaultWeight: criterion.defaultWeight,
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
      createdCriteria.map((criterion) => [
        criterion.name,
        { id: criterion.id },
      ]),
    );
    const criterionIdsByKey = new Map<string, { id: string }>();

    for (const criterion of SEED_CRITERIA) {
      const createdCriterion = criteriaByName.get(criterion.name);

      if (!createdCriterion) {
        throw new Error(`Seed criterion '${criterion.name}' was not created.`);
      }

      criterionIdsByKey.set(criterion.key, createdCriterion);
    }

    await prisma.dailyGeneralReport.createMany({
      data: SEED_DAILY_GENERAL_REPORTS.map((report) => ({
        reportDate: toDateOnly(report.reportDate),
        service: report.service,
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
          "daily report reporter",
        ),
      })),
    });

    await prisma.colisNonVu.createMany({
      data: SEED_COLIS_NON_VUS.map((record) => ({
        reportDate: toDateOnly(record.reportDate),
        service: record.service,
        immatriculation: record.immatriculation,
        agenceDepart: record.agenceDepart,
        description: record.description,
        destinataire: record.destinataire,
        destinatairePhone: record.destinatairePhone,
        actionEnCours: record.actionEnCours,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "colis non vu reporter",
        ),
      })),
    });

    await prisma.colisHorsBordereau.createMany({
      data: SEED_COLIS_HORS_BORDEREAU.map((record) => ({
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
          "hors bordereau reporter",
        ),
      })),
    });

    await prisma.erreurDestination.createMany({
      data: SEED_ERREURS_DESTINATION.map((record) => ({
        reportDate: toDateOnly(record.reportDate),
        immatriculation: record.immatriculation,
        destination: record.destination,
        description: record.description,
        destinationPrevue: record.destinationPrevue,
        destinationErronee: record.destinationErronee,
        destinataire: record.destinataire,
        destinatairePhone: record.destinatairePhone,
        equipeFacturation: record.equipeFacturation,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "erreur destination reporter",
        ),
      })),
    });

    await prisma.colisRetarde.createMany({
      data: SEED_COLIS_RETARDES.map((record) => ({
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
          "colis retarde reporter",
        ),
      })),
    });

    await prisma.colisNonIdentifie.createMany({
      data: SEED_COLIS_NON_IDENTIFIES.map((record) => ({
        reportDate: toDateOnly(record.reportDate),
        descriptionColis: record.descriptionColis,
        motifNonIdentification: record.motifNonIdentification,
        actionMenee: record.actionMenee,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "colis non identifie reporter",
        ),
      })),
    });

    await prisma.colisTransfere.createMany({
      data: SEED_COLIS_TRANSFERES.map((record) => ({
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
          "colis transfere reporter",
        ),
      })),
    });

    await prisma.classementColi.createMany({
      data: SEED_CLASSEMENT_COLIS.map((record) => ({
        reportDate: toDateOnly(record.reportDate),
        typeColis: record.typeColis,
        emplacement: record.emplacement,
        deplaceAvant15h: record.deplaceAvant15h,
        notes: record.notes,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "classement reporter",
        ),
      })),
    });

    await prisma.convoyeurAbsent.createMany({
      data: SEED_CONVOYEURS_ABSENTS.map((record) => ({
        reportDate: toDateOnly(record.reportDate),
        nom: record.nom,
        numero: record.numero,
        vehicule: record.vehicule,
        agenceProvenance: record.agenceProvenance,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "convoyeur absent reporter",
        ),
      })),
    });

    await prisma.bordereauNonConforme.createMany({
      data: SEED_BORDEREAUX_NON_CONFORMES.map((record) => ({
        reportDate: toDateOnly(record.reportDate),
        numeroBordereau: record.numeroBordereau,
        motifNonConformite: record.motifNonConformite,
        actionMenee: record.actionMenee,
        createdAt: toDateTime(record.createdAt),
        reportedById: getRequiredId(
          userIdsByKey,
          record.reportedByKey,
          "bordereau reporter",
        ),
      })),
    });

    await prisma.vehiculeEmbarque.createMany({
      data: SEED_VEHICULES_EMBARQUES.map((record) => ({
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
          "vehicule embarque reporter",
        ),
      })),
    });

    await prisma.signatureLog.createMany({
      data: SEED_SIGNATURE_LOGS.map((record) => ({
        slipNumber: record.slipNumber,
        signedAt: toDateTime(record.signedAt),
        userId: getRequiredId(userIdsByKey, record.userKey, "signature user"),
      })),
    });

    await prisma.personnelEvaluation.createMany({
      data: SEED_PERSONNEL_EVALUATIONS.map((record) => ({
        evaluationDate: toDateOnly(record.evaluationDate),
        weightOverride: record.weightOverride,
        notes: record.notes,
        createdAt: toDateTime(record.createdAt),
        userId: getRequiredId(userIdsByKey, record.userKey, "evaluation user"),
        criteriaId: getRequiredId(
          criterionIdsByKey,
          record.criteriaKey,
          "evaluation criterion",
        ),
        recordedById: getRequiredId(
          userIdsByKey,
          record.recordedByKey,
          "evaluation recorder",
        ),
      })),
    });

    console.log(
      `[seed] Created ${userDefinitions.length} users, ${SEED_CRITERIA.length} criteria, ${SEED_DAILY_GENERAL_REPORTS.length} daily reports, ${SEED_SIGNATURE_LOGS.length} signatures, and ${SEED_PERSONNEL_EVALUATIONS.length} evaluations.`,
    );
    console.log("[seed] Deterministic sample dataset loaded successfully.");
  } finally {
    await prisma.$disconnect();
  }
}
