import "dotenv/config";
import { scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import {
  getSeedUsers,
  SEED_AGENCIES,
  SEED_ATTENDANCE_CRITERION_SETTINGS,
  SEED_CRITERIA,
  SEED_GENERAL_REPORTS,
  SEED_INCIDENT_TEMPLATES,
  SEED_INCIDENT_TEMPLATE_VERSIONS,
  SEED_PERSONNEL_EVALUATIONS,
  SEED_SERVICE_INCIDENT_BINDINGS,
  SEED_SERVICES,
  SEED_SIGNATURE_LOGS,
  SEED_WORK_POSTS,
  SEED_WORK_SCHEDULES,
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

function toDateTime(value: string | null): Date | null {
  return value ? new Date(value) : null;
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

function assertUniqueUsernames(usernames: string[]) {
  if (new Set(usernames).size !== usernames.length) {
    throw new Error("Seed user definitions contain duplicate usernames.");
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function runSeed() {
  const prisma = createClient();
  const rootConfig = readRootConfig();
  const userDefinitions = getSeedUsers(rootConfig);

  assertUniqueUsernames(userDefinitions.map(user => user.username));

  const userIdsByKey = new Map<string, string>();
  const agencyIdsByKey = new Map<string, string>();
  const serviceIdsByKey = new Map<string, string>();
  const workPostIdsByKey = new Map<string, string>();
  const criterionIdsByKey = new Map<string, string>();
  const templateIdsByKey = new Map<string, string>();
  const templateVersionIdsByKey = new Map<string, string>();
  const bindingIdsByKey = new Map<string, string>();
  const workScheduleIdsByKey = new Map<string, string>();

  const templateDefinitionsByKey = new Map(
    SEED_INCIDENT_TEMPLATES.map(template => [template.key, template])
  );
  const templateVersionDefinitionsByKey = new Map(
    SEED_INCIDENT_TEMPLATE_VERSIONS.map(version => [version.key, version])
  );

  console.log(
    "[seed] Resetting and loading current service/report fixtures..."
  );

  try {
    await prisma.signatureLog.deleteMany();
    await prisma.generalReportIncidentEntry.deleteMany();
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
    await prisma.agency.deleteMany();
    await prisma.user.deleteMany();

    for (const user of userDefinitions) {
      const createdUser = await prisma.user.create({
        data: {
          username: user.username,
          password: hashSeedPassword(user.password, user.username),
          fullName: user.fullName,
          phone: user.phone,
          systemRole: user.systemRole,
          isActive: user.isActive,
        },
      });

      userIdsByKey.set(user.key, createdUser.id);
    }

    for (const agency of SEED_AGENCIES) {
      const createdAgency = await prisma.agency.create({
        data: {
          name: agency.name,
          code: agency.code,
          isActive: agency.isActive,
        },
      });

      agencyIdsByKey.set(agency.key, createdAgency.id);
    }

    for (const user of userDefinitions) {
      for (const membership of user.memberships) {
        await prisma.userAgencyMembership.create({
          data: {
            userId: getRequiredId(userIdsByKey, user.key, "membership user"),
            agencyId: getRequiredId(
              agencyIdsByKey,
              membership.agencyKey,
              "membership agency"
            ),
            isActive: membership.isActive,
          },
        });
      }
    }

    for (const service of SEED_SERVICES) {
      const createdService = await prisma.serviceDefinition.create({
        data: {
          agencyId: getRequiredId(
            agencyIdsByKey,
            service.agencyKey,
            "service agency"
          ),
          name: service.name,
          code: service.code,
          description: service.description,
          color: service.color,
          isActive: service.isActive,
          createdById: getRequiredId(
            userIdsByKey,
            service.createdByKey,
            "service creator"
          ),
        },
      });

      serviceIdsByKey.set(service.key, createdService.id);
    }

    for (const workPost of SEED_WORK_POSTS) {
      const createdWorkPost = await prisma.workPost.create({
        data: {
          agencyId: getRequiredId(
            agencyIdsByKey,
            workPost.agencyKey,
            "work post agency"
          ),
          name: workPost.name,
          code: workPost.code,
          description: workPost.description,
          isActive: workPost.isActive,
          createdById: getRequiredId(
            userIdsByKey,
            workPost.createdByKey,
            "work post creator"
          ),
        },
      });

      workPostIdsByKey.set(workPost.key, createdWorkPost.id);
    }

    for (const criterion of SEED_CRITERIA) {
      const createdCriterion = await prisma.criterion.create({
        data: {
          agencyId: getRequiredId(
            agencyIdsByKey,
            criterion.agencyKey,
            "criterion agency"
          ),
          name: criterion.name,
          impact: criterion.impact,
          weight: criterion.weight,
          maxDaily: criterion.maxDaily,
          isActive: criterion.isActive,
          createdById: getRequiredId(
            userIdsByKey,
            criterion.createdByKey,
            "criterion creator"
          ),
        },
      });

      criterionIdsByKey.set(criterion.key, createdCriterion.id);
    }

    for (const setting of SEED_ATTENDANCE_CRITERION_SETTINGS) {
      await prisma.attendanceCriterionSetting.create({
        data: {
          agencyId: getRequiredId(
            agencyIdsByKey,
            setting.agencyKey,
            "attendance agency"
          ),
          criterionId: getRequiredId(
            criterionIdsByKey,
            setting.criterionKey,
            "attendance criterion"
          ),
          isEnabled: setting.isEnabled,
          createdById: getRequiredId(
            userIdsByKey,
            setting.createdByKey,
            "attendance setting creator"
          ),
        },
      });
    }

    for (const template of SEED_INCIDENT_TEMPLATES) {
      const createdTemplate = await prisma.incidentTemplate.create({
        data: {
          agencyId: getRequiredId(
            agencyIdsByKey,
            template.agencyKey,
            "template agency"
          ),
          name: template.name,
          code: template.code,
          description: template.description,
          icon: template.icon,
          isActive: template.isActive,
          createdById: getRequiredId(
            userIdsByKey,
            template.createdByKey,
            "template creator"
          ),
        },
      });

      templateIdsByKey.set(template.key, createdTemplate.id);
    }

    for (const version of SEED_INCIDENT_TEMPLATE_VERSIONS) {
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
          publishedAt: toDateTime(version.publishedAt),
          createdById: getRequiredId(
            userIdsByKey,
            version.createdByKey,
            "template version creator"
          ),
        },
      });

      templateVersionIdsByKey.set(version.key, createdVersion.id);
    }

    for (const binding of SEED_SERVICE_INCIDENT_BINDINGS) {
      const createdBinding = await prisma.serviceIncidentBinding.create({
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

      bindingIdsByKey.set(binding.key, createdBinding.id);
    }

    for (const schedule of SEED_WORK_SCHEDULES) {
      const createdSchedule = await prisma.workSchedule.create({
        data: {
          agencyId: getRequiredId(
            agencyIdsByKey,
            schedule.agencyKey,
            "schedule agency"
          ),
          serviceId: getRequiredId(
            serviceIdsByKey,
            schedule.serviceKey,
            "schedule service"
          ),
          workDate: toDateOnly(schedule.workDate),
          status: schedule.status,
          createdById: getRequiredId(
            userIdsByKey,
            schedule.createdByKey,
            "schedule creator"
          ),
          publishedAt: toDateTime(schedule.publishedAt),
          archivedAt: toDateTime(schedule.archivedAt),
        },
      });

      workScheduleIdsByKey.set(schedule.key, createdSchedule.id);

      for (const assignment of schedule.assignments) {
        await prisma.workScheduleAssignment.create({
          data: {
            workScheduleId: createdSchedule.id,
            userId: getRequiredId(
              userIdsByKey,
              assignment.userKey,
              "assignment user"
            ),
            postId: getRequiredId(
              workPostIdsByKey,
              assignment.postKey,
              "assignment post"
            ),
            isLeader: assignment.isLeader,
            isSubleader: assignment.isSubleader,
            attendanceStatus: assignment.attendanceStatus,
          },
        });
      }

      const activeBindings = SEED_SERVICE_INCIDENT_BINDINGS.filter(
        binding =>
          binding.serviceKey === schedule.serviceKey && binding.isActive
      ).sort((left, right) => left.displayOrder - right.displayOrder);

      for (const binding of activeBindings) {
        const template = templateDefinitionsByKey.get(binding.templateKey);
        const version = templateVersionDefinitionsByKey.get(
          binding.templateVersionKey
        );

        if (!template || !version) {
          throw new Error(
            `Missing incident metadata for binding: ${binding.key}`
          );
        }

        await prisma.workScheduleIncidentRequirement.create({
          data: {
            workScheduleId: createdSchedule.id,
            serviceIncidentBindingId: getRequiredId(
              bindingIdsByKey,
              binding.key,
              "schedule requirement binding"
            ),
            templateId: getRequiredId(
              templateIdsByKey,
              binding.templateKey,
              "schedule requirement template"
            ),
            templateVersionId: getRequiredId(
              templateVersionIdsByKey,
              binding.templateVersionKey,
              "schedule requirement version"
            ),
            configSnapshotJson: toJson({
              binding: {
                minEntries: binding.minEntries,
                maxEntries: binding.maxEntries,
                isRequired: binding.isRequired,
                displayOrder: binding.displayOrder,
                isActive: binding.isActive,
              },
              template: {
                name: template.name,
                code: template.code,
                description: template.description,
              },
              templateVersion: {
                version: version.version,
                status: version.status,
                publishedAt: version.publishedAt,
              },
              fields: version.fields,
            }),
            displayOrder: binding.displayOrder,
            isActive: binding.isActive,
          },
        });
      }
    }

    for (const report of SEED_GENERAL_REPORTS) {
      const createdReport = await prisma.generalReport.create({
        data: {
          workScheduleId: getRequiredId(
            workScheduleIdsByKey,
            report.workScheduleKey,
            "general report schedule"
          ),
          reportedById: getRequiredId(
            userIdsByKey,
            report.reportedByKey,
            "general report reporter"
          ),
          readById: report.readByKey
            ? getRequiredId(
                userIdsByKey,
                report.readByKey,
                "general report reader"
              )
            : null,
          isRead: report.isRead,
          readAt: toDateTime(report.readAt),
          personnelPresent: report.personnelPresent,
          personnelAbsent: report.personnelAbsent,
          ambianceGenerale: report.ambianceGenerale,
          problemesRencontres: report.problemesRencontres,
          etatGeneralService: report.etatGeneralService,
          passationService: report.passationService,
          observationGeneral: report.observationGeneral,
        },
      });

      for (const entry of report.incidentEntries) {
        const template = templateDefinitionsByKey.get(entry.templateKey);
        const version = templateVersionDefinitionsByKey.get(
          entry.templateVersionKey
        );

        if (!template || !version) {
          throw new Error(
            `Missing incident snapshot metadata for report entry on ${report.workScheduleKey}`
          );
        }

        await prisma.generalReportIncidentEntry.create({
          data: {
            generalReportId: createdReport.id,
            workScheduleId: getRequiredId(
              workScheduleIdsByKey,
              report.workScheduleKey,
              "report incident schedule"
            ),
            templateId: getRequiredId(
              templateIdsByKey,
              entry.templateKey,
              "report template"
            ),
            templateVersionId: getRequiredId(
              templateVersionIdsByKey,
              entry.templateVersionKey,
              "report template version"
            ),
            templateNameSnapshot: template.name,
            templateCodeSnapshot: template.code,
            valuesJson: toJson(entry.values),
            schemaSnapshotJson: toJson(version.fields),
            displayOrder: entry.displayOrder,
          },
        });
      }
    }

    for (const evaluation of SEED_PERSONNEL_EVALUATIONS) {
      await prisma.personnelEvaluation.create({
        data: {
          workScheduleId: getRequiredId(
            workScheduleIdsByKey,
            evaluation.workScheduleKey,
            "evaluation schedule"
          ),
          evaluatedUserId: getRequiredId(
            userIdsByKey,
            evaluation.evaluatedUserKey,
            "evaluated user"
          ),
          evaluatingLeaderId: getRequiredId(
            userIdsByKey,
            evaluation.evaluatingLeaderKey,
            "evaluating leader"
          ),
          criterionId: getRequiredId(
            criterionIdsByKey,
            evaluation.criterionKey,
            "evaluation criterion"
          ),
          score: evaluation.score,
          comment: evaluation.comment,
        },
      });
    }

    for (const log of SEED_SIGNATURE_LOGS) {
      await prisma.signatureLog.create({
        data: {
          workScheduleId: getRequiredId(
            workScheduleIdsByKey,
            log.workScheduleKey,
            "signature log schedule"
          ),
          userId: getRequiredId(
            userIdsByKey,
            log.userKey,
            "signature log user"
          ),
          slipNumber: log.slipNumber,
          signedAt: toDateTime(log.signedAt),
          busArrivalTime: toDateTime(log.busArrivalTime),
        },
      });
    }

    console.log(
      `[seed] Seeded ${userIdsByKey.size} users, ${agencyIdsByKey.size} agency, ` +
        `${serviceIdsByKey.size} services, ${workPostIdsByKey.size} work posts, ` +
        `${workScheduleIdsByKey.size} schedules.`
    );
  } finally {
    await prisma.$disconnect();
  }
}
