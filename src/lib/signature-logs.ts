import type { Prisma } from "@/generated/prisma/client";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

type SignatureLogQuery = {
  from?: string;
  page?: string;
  pageSize?: string;
  q?: string;
  to?: string;
  userId?: string;
  workScheduleId?: string;
};

type SignatureLogInput = {
  busArrivalTime?: string;
  signedAt?: string;
  slipNumber?: string;
  userId?: string;
  workScheduleId?: string;
};

function normalizePage(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function normalizePageSize(value: string | undefined) {
  const parsed = Number(value);

  if (parsed === 20 || parsed === 50) {
    return parsed;
  }

  return 10;
}

function normalizeDateInput(value: string | undefined) {
  if (!value) {
    return "";
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function parseOptionalDateTimeInput(
  value: string | undefined,
  fieldLabel: string
) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldLabel} invalide.`);
  }

  return parsed;
}

function serializeScheduleOption(schedule: {
  id: string;
  workDate: Date;
  service: {
    name: string;
  };
}) {
  return {
    id: schedule.id,
    serviceName: schedule.service.name,
    workDate: schedule.workDate.toISOString(),
  };
}

function serializeSignatureLog(signature: {
  id: string;
  slipNumber: string;
  signedAt: Date | null;
  busArrivalTime: Date | null;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
    username: string;
    memberships: Array<{
      role: "admin" | "scheduler" | "reporter" | "worker";
    }>;
  };
  workSchedule: {
    id: string;
    workDate: Date;
    service: {
      name: string;
    };
  };
}) {
  return {
    busArrivalTime: signature.busArrivalTime?.toISOString() ?? null,
    createdAt: signature.createdAt.toISOString(),
    id: signature.id,
    signedAt: signature.signedAt?.toISOString() ?? null,
    slipNumber: signature.slipNumber,
    user: {
      id: signature.user.id,
      fullName: signature.user.fullName,
      role: signature.user.memberships[0]?.role ?? "worker",
      username: signature.user.username,
    },
    workSchedule: {
      id: signature.workSchedule.id,
      serviceName: signature.workSchedule.service.name,
      workDate: signature.workSchedule.workDate.toISOString(),
    },
  };
}

async function ensureSignatureAccess(session: SessionPayload) {
  if (!session.activeAgencyId) {
    throw new Error("Accès refusé.");
  }
}

async function listSignatureSchedules(session: SessionPayload) {
  const schedules = await prisma.workSchedule.findMany({
    where: {
      agencyId: session.activeAgencyId,
      workDate: {
        gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), // last 7 days
        lte: new Date(), // today
      },
    },
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      workDate: true,
      service: {
        select: {
          name: true,
        },
      },
      assignments: {
        orderBy: [
          { isLeader: "desc" },
          { isSubleader: "desc" },
          { createdAt: "asc" },
        ],
        select: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              memberships: {
                where: {
                  agencyId: session.activeAgencyId,
                  isActive: true,
                },
                take: 1,
                select: {
                  role: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return {
    schedules: schedules.map(serializeScheduleOption),
    signersBySchedule: Object.fromEntries(
      schedules.map(schedule => [
        schedule.id,
        schedule.assignments.map(assignment => ({
          id: assignment.user.id,
          fullName: assignment.user.fullName,
          role: assignment.user.memberships[0]?.role ?? "worker",
          username: assignment.user.username,
        })),
      ])
    ),
  };
}

async function listSignatureAgents(session: SessionPayload) {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      memberships: {
        some: {
          agencyId: session.activeAgencyId,
          isActive: true,
        },
      },
      workScheduleAssignments: {
        some: {
          workSchedule: {
            agencyId: session.activeAgencyId,
          },
        },
      },
    },
    orderBy: [{ fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      username: true,
      memberships: {
        where: {
          agencyId: session.activeAgencyId,
          isActive: true,
        },
        take: 1,
        select: {
          role: true,
        },
      },
    },
  });

  return users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    role: user.memberships[0]?.role ?? "worker",
    username: user.username,
  }));
}

async function validateSignaturePayload(
  session: SessionPayload,
  input: SignatureLogInput
) {
  await ensureSignatureAccess(session);

  const workScheduleId = (input.workScheduleId || "").trim();
  const userId = (input.userId || "").trim();
  const slipNumber = (input.slipNumber || "").trim();

  if (!workScheduleId) {
    throw new Error("Le planning est requis.");
  }

  if (!userId) {
    throw new Error("Le signataire est requis.");
  }

  if (!slipNumber) {
    throw new Error("Le numéro de bordereau est requis.");
  }

  const schedule = await prisma.workSchedule.findFirst({
    where: {
      id: workScheduleId,
      agencyId: session.activeAgencyId,
    },
    select: {
      id: true,
      assignments: {
        where: {
          userId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new Error("Le planning sélectionné est introuvable.");
  }

  if (schedule.assignments.length === 0) {
    throw new Error("Le signataire doit être affecté au planning sélectionné.");
  }

  const isAdmin = canAccessAgencyAdminWorkspace(session);

  if (!isAdmin) {
    const signerMembership = await prisma.userAgencyMembership.findFirst({
      where: {
        userId,
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!signerMembership) {
      throw new Error(
        "Le signataire sélectionné n'appartient pas à votre agence."
      );
    }
  }

  return {
    busArrivalTime: parseOptionalDateTimeInput(
      input.busArrivalTime,
      "L'heure d'arrivée du bus"
    ),
    signedAt: parseOptionalDateTimeInput(
      input.signedAt,
      "La date de signature"
    ),
    slipNumber,
    userId,
    workScheduleId,
  };
}

export function formatSignatureDateTimeInput(value: Date | string | null) {
  if (!value) {
    return "";
  }

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 16);
}

export function getDefaultSignatureFormState() {
  return {
    busArrivalTime: "",
    signedAt: "",
    slipNumber: "",
    userId: "",
    workScheduleId: "",
  };
}

export async function getSignatureLogFormOptions(session: SessionPayload) {
  await ensureSignatureAccess(session);

  const [signers, schedulePayload] = await Promise.all([
    listSignatureAgents(session),
    listSignatureSchedules(session),
  ]);

  return {
    schedules: schedulePayload.schedules,
    signers,
    signersBySchedule: schedulePayload.signersBySchedule,
  };
}

export async function listSignatureLogs(
  session: SessionPayload,
  query: SignatureLogQuery
) {
  await ensureSignatureAccess(session);

  const search = (query.q || "").trim();
  const userId = (query.userId || "").trim();
  const workScheduleId = (query.workScheduleId || "").trim();
  const startDate = normalizeDateInput(query.from);
  const endDate = normalizeDateInput(query.to);
  const pageSize = normalizePageSize(query.pageSize);

  const workDateFilter: Prisma.DateTimeFilter = {
    ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
    ...(endDate ? { lte: new Date(`${endDate}T00:00:00.000Z`) } : {}),
  };

  const where: Prisma.SignatureLogWhereInput = {
    workSchedule: {
      agencyId: session.activeAgencyId,
      ...(workScheduleId ? { id: workScheduleId } : {}),
      ...(startDate || endDate ? { workDate: workDateFilter } : {}),
    },
    ...(userId ? { userId } : {}),
  };

  if (search) {
    where.OR = [
      { slipNumber: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
      {
        workSchedule: {
          service: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      },
    ];
  }

  const [schedulePayload, signers, totalItems] = await Promise.all([
    listSignatureSchedules(session),
    listSignatureAgents(session),
    prisma.signatureLog.count({ where }),
  ]);

  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const page = Math.min(normalizePage(query.page), totalPages);
  const now = new Date();
  const todayStart = new Date(
    `${now.toISOString().slice(0, 10)}T00:00:00.000Z`
  );
  const monthStart = new Date(
    `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00.000Z`
  );

  const [signatures, todayCount, monthCount, activeSignerRows] =
    await Promise.all([
      prisma.signatureLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slipNumber: true,
          signedAt: true,
          busArrivalTime: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              memberships: {
                where: {
                  agencyId: session.activeAgencyId,
                  isActive: true,
                },
                take: 1,
                select: {
                  role: true,
                },
              },
            },
          },
          workSchedule: {
            select: {
              id: true,
              workDate: true,
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.signatureLog.count({
        where: {
          ...where,
          createdAt: {
            gte: todayStart,
          },
        },
      }),
      prisma.signatureLog.count({
        where: {
          ...where,
          createdAt: {
            gte: monthStart,
          },
        },
      }),
      prisma.signatureLog.findMany({
        where,
        distinct: ["userId"],
        select: {
          userId: true,
        },
      }),
    ]);

  return {
    filters: {
      endDate,
      page,
      pageSize,
      search,
      startDate,
      userId,
      workScheduleId,
    },
    pagination: {
      totalItems,
      totalPages,
    },
    schedules: schedulePayload.schedules,
    signers,
    signatures: signatures.map(serializeSignatureLog),
    summary: {
      activeSigners: activeSignerRows.length,
      monthCount,
      todayCount,
      totalItems,
    },
  };
}

export async function getSignatureLogById(session: SessionPayload, id: string) {
  await ensureSignatureAccess(session);

  const signature = await prisma.signatureLog.findFirst({
    where: {
      id,
      workSchedule: {
        agencyId: session.activeAgencyId,
      },
    },
    select: {
      id: true,
      slipNumber: true,
      signedAt: true,
      busArrivalTime: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          username: true,
          memberships: {
            where: {
              agencyId: session.activeAgencyId,
              isActive: true,
            },
            take: 1,
            select: {
              role: true,
            },
          },
        },
      },
      workSchedule: {
        select: {
          id: true,
          workDate: true,
          service: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!signature) {
    return null;
  }

  const formOptions = await getSignatureLogFormOptions(session);
  const currentScheduleSigners =
    formOptions.signersBySchedule[signature.workSchedule.id] ?? [];

  if (!currentScheduleSigners.some(signer => signer.id === signature.user.id)) {
    formOptions.signersBySchedule[signature.workSchedule.id] = [
      ...currentScheduleSigners,
      {
        id: signature.user.id,
        fullName: signature.user.fullName,
        role: signature.user.memberships[0]?.role ?? "worker",
        username: signature.user.username,
      },
    ];
  }

  return {
    ...formOptions,
    signature: serializeSignatureLog(signature),
  };
}

export async function createSignatureLog(
  session: SessionPayload,
  input: SignatureLogInput
) {
  const payload = await validateSignaturePayload(session, input);
  const signature = await prisma.signatureLog.create({
    data: payload,
    select: {
      id: true,
    },
  });

  return { signature };
}

export async function updateSignatureLog(
  session: SessionPayload,
  id: string,
  input: SignatureLogInput
) {
  const existing = await prisma.signatureLog.findFirst({
    where: {
      id,
      workSchedule: {
        agencyId: session.activeAgencyId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return null;
  }

  const payload = await validateSignaturePayload(session, input);
  const signature = await prisma.signatureLog.update({
    where: {
      id,
    },
    data: payload,
    select: {
      id: true,
    },
  });

  return { signature };
}

export async function deleteSignatureLog(session: SessionPayload, id: string) {
  const existing = await prisma.signatureLog.findFirst({
    where: {
      id,
      workSchedule: {
        agencyId: session.activeAgencyId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return null;
  }

  await prisma.signatureLog.delete({
    where: {
      id,
    },
  });

  return true;
}
