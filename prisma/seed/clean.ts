import "dotenv/config";
import { scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { UserPermission } from "../../src/generated/prisma/enums";
import {
  getSeedUsers,
  SEED_AGENCIES,
  SEED_INCIDENT_TEMPLATES,
  SEED_INCIDENT_TEMPLATE_VERSIONS,
  SEED_SERVICE_INCIDENT_BINDINGS,
  SEED_SERVICES,
  type RootSeedConfig,
} from "./data";

const SCRYPT_KEYLEN = 64;
const TARGET_AGENCY_KEY = "agency_gev_baf";
const TARGET_SERVICE_KEY = "service_courier_baf";
const TARGET_SERVICE_NAME = "Servive Courrier";

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

function hashSeedPassword(password: string, saltSource: string): string {
  const salt = `seed-${saltSource}`;
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function getRequiredId(store: Map<string, string>, key: string, label: string) {
  const value = store.get(key);

  if (!value) {
    throw new Error(`Missing seed reference for ${label}: ${key}`);
  }

  return value;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function runSeedClean() {
  const prisma = createClient();
  const rootConfig = readRootConfig();

  const rootUserDefinition = getSeedUsers(rootConfig).find(
    user => user.key === "root"
  );

  if (!rootUserDefinition) {
    throw new Error("Root user definition not found.");
  }

  const agencyDefinition =
    SEED_AGENCIES.find(agency => agency.key === TARGET_AGENCY_KEY) ??
    SEED_AGENCIES[0];

  if (!agencyDefinition) {
    throw new Error("Agency seed definition not found.");
  }

  const serviceDefinition = SEED_SERVICES.find(
    service => service.key === TARGET_SERVICE_KEY
  );

  if (!serviceDefinition) {
    throw new Error("Courier service seed definition not found.");
  }

  const serviceBindings = SEED_SERVICE_INCIDENT_BINDINGS.filter(
    binding => binding.serviceKey === serviceDefinition.key
  ).sort((left, right) => left.displayOrder - right.displayOrder);

  const templateKeySet = new Set(
    serviceBindings.map(binding => binding.templateKey)
  );
  const templateVersionKeySet = new Set(
    serviceBindings.map(binding => binding.templateVersionKey)
  );

  const incidentTemplates = SEED_INCIDENT_TEMPLATES.filter(template =>
    templateKeySet.has(template.key)
  );

  const incidentTemplateVersions = SEED_INCIDENT_TEMPLATE_VERSIONS.filter(
    version => templateVersionKeySet.has(version.key)
  );

  const agencyIdsByKey = new Map<string, string>();
  const userIdsByKey = new Map<string, string>();
  const serviceIdsByKey = new Map<string, string>();
  const templateIdsByKey = new Map<string, string>();
  const templateVersionIdsByKey = new Map<string, string>();

  console.log("[seed:clean] Resetting and loading minimal fixtures...");

  try {
    await prisma.signatureLog.deleteMany();
    await prisma.generalReportIncidentEntry.deleteMany();
    await prisma.generalReportPersonnelAttendance.deleteMany();
    await prisma.generalReport.deleteMany();
    await prisma.personnelEvaluation.deleteMany();
    await prisma.workScheduleIncidentRequirement.deleteMany();
    await prisma.serviceIncidentBinding.deleteMany();
    await prisma.incidentTemplateVersion.deleteMany();
    await prisma.incidentTemplate.deleteMany();
    await prisma.workScheduleAssignment.deleteMany();
    await prisma.workSchedule.deleteMany();
    await prisma.attendanceCriterionSetting.deleteMany();
    await prisma.criterion.deleteMany();
    await prisma.workPost.deleteMany();
    await prisma.serviceDefinition.deleteMany();
    await prisma.userAgencyMembership.deleteMany();
    await prisma.role.deleteMany();
    await prisma.agency.deleteMany();
    await prisma.user.deleteMany();

    const rootUser = await prisma.user.create({
      data: {
        username: rootUserDefinition.username,
        password: hashSeedPassword(
          rootUserDefinition.password,
          rootUserDefinition.username
        ),
        fullName: rootUserDefinition.fullName,
        phone: rootUserDefinition.phone,
        systemRole: rootUserDefinition.systemRole,
        isActive: rootUserDefinition.isActive,
      },
    });

    userIdsByKey.set(rootUserDefinition.key, rootUser.id);

    const createdAgency = await prisma.agency.create({
      data: {
        name: agencyDefinition.name,
        code: agencyDefinition.code,
        isActive: agencyDefinition.isActive,
      },
    });

    agencyIdsByKey.set(agencyDefinition.key, createdAgency.id);

    const adminRole = await prisma.role.create({
      data: {
        agencyId: createdAgency.id,
        name: "Administrateur",
        description: "Accès complet aux ressources de l'agence",
        permissions: Object.values(UserPermission),
        createdById: rootUser.id,
      },
    });

    await prisma.userAgencyMembership.create({
      data: {
        userId: rootUser.id,
        agencyId: createdAgency.id,
        isActive: true,
        roles: {
          connect: { id: adminRole.id },
        },
      },
    });

    const createdService = await prisma.serviceDefinition.create({
      data: {
        agencyId: createdAgency.id,
        name: TARGET_SERVICE_NAME,
        code: serviceDefinition.code,
        description: serviceDefinition.description,
        color: serviceDefinition.color,
        isActive: serviceDefinition.isActive,
        createdById: rootUser.id,
      },
    });

    serviceIdsByKey.set(serviceDefinition.key, createdService.id);

    for (const template of incidentTemplates) {
      const createdTemplate = await prisma.incidentTemplate.create({
        data: {
          agencyId: getRequiredId(
            agencyIdsByKey,
            agencyDefinition.key,
            "template agency"
          ),
          name: template.name,
          code: template.code,
          description: template.description,
          icon: template.icon,
          isActive: template.isActive,
          createdById: getRequiredId(
            userIdsByKey,
            rootUserDefinition.key,
            "template creator"
          ),
        },
      });

      templateIdsByKey.set(template.key, createdTemplate.id);
    }

    for (const version of incidentTemplateVersions) {
      const createdVersion = await prisma.incidentTemplateVersion.create({
        data: {
          templateId: getRequiredId(
            templateIdsByKey,
            version.templateKey,
            "template version template"
          ),
          version: version.version,
          fieldsJson: toJson(version.fields),
          status: version.status,
          publishedAt: version.publishedAt
            ? new Date(version.publishedAt)
            : null,
          createdById: getRequiredId(
            userIdsByKey,
            rootUserDefinition.key,
            "template version creator"
          ),
        },
      });

      templateVersionIdsByKey.set(version.key, createdVersion.id);
    }

    for (const binding of serviceBindings) {
      await prisma.serviceIncidentBinding.create({
        data: {
          serviceId: getRequiredId(
            serviceIdsByKey,
            binding.serviceKey,
            "binding service"
          ),
          templateId: getRequiredId(
            templateIdsByKey,
            binding.templateKey,
            "binding template"
          ),
          templateVersionId: getRequiredId(
            templateVersionIdsByKey,
            binding.templateVersionKey,
            "binding template version"
          ),
          minEntries: binding.minEntries,
          maxEntries: binding.maxEntries,
          isRequired: binding.isRequired,
          displayOrder: binding.displayOrder,
          isActive: binding.isActive,
        },
      });
    }

    console.log(
      `[seed:clean] Seeded 1 user, 1 agency, 1 service, ${incidentTemplates.length} incident templates, ${serviceBindings.length} bindings.`
    );
  } finally {
    await prisma.$disconnect();
  }
}
