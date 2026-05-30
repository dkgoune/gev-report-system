import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

type SignatureLogQuery = {
  from?: string;
  page?: string;
  pageSize?: string;
  q?: string;
  to?: string;
  userId?: string;
};

type SignatureLogInput = {
  userId?: string;
  signatureCount?: number;
  signedAt?: string;
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

function serializeSignatureLog(signature: {
  id: string;
  signatureCount: number;
  signedAt: Date;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
    username: string;
  };
}) {
  return {
    createdAt: signature.createdAt.toISOString(),
    id: signature.id,
    signedAt: signature.signedAt.toISOString(),
    signatureCount: signature.signatureCount,
    user: {
      id: signature.user.id,
      fullName: signature.user.fullName,
      username: signature.user.username,
    },
  };
}

async function ensureSignatureAccess(session: SessionPayload) {
  if (!session.activeAgencyId) {
    throw new Error("Accès refusé.");
  }
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
    },
    orderBy: [{ fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      username: true,
    },
  });

  return users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    username: user.username,
  }));
}

async function validateSignaturePayload(
  session: SessionPayload,
  input: SignatureLogInput
) {
  await ensureSignatureAccess(session);

  const userId = (input.userId || "").trim();
  const signatureCount = Number(input.signatureCount) || 1;
  const signedAtInput = input.signedAt;

  if (!userId) {
    throw new Error("Le signataire est requis.");
  }

  if (!Number.isInteger(signatureCount) || signatureCount < 1) {
    throw new Error("Le nombre de signatures doit être un entier supérieur ou égal à 1.");
  }

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

  const signedAt = signedAtInput ? new Date(signedAtInput) : new Date();
  if (Number.isNaN(signedAt.getTime())) {
    throw new Error("La date de signature est invalide.");
  }

  return {
    userId,
    signatureCount,
    signedAt,
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
  const now = new Date();
  // Get local timezone offset to render local datetime
  const offset = now.getTimezoneOffset() * 60000;
  const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);

  return {
    userId: "",
    signatureCount: 1,
    signedAt: localISOTime,
  };
}

export async function getSignatureLogFormOptions(session: SessionPayload) {
  await ensureSignatureAccess(session);

  const signers = await listSignatureAgents(session);

  return {
    signers,
  };
}

export async function listSignatureLogs(
  session: SessionPayload,
  query: SignatureLogQuery
) {
  await ensureSignatureAccess(session);

  const search = (query.q || "").trim();
  const userId = (query.userId || "").trim();
  const startDate = normalizeDateInput(query.from);
  const endDate = normalizeDateInput(query.to);
  const pageSize = normalizePageSize(query.pageSize);

  const signedAtFilter: Prisma.DateTimeFilter = {
    ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
    ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
  };

  const where: Prisma.SignatureLogWhereInput = {
    user: {
      memberships: {
        some: {
          agencyId: session.activeAgencyId,
          isActive: true,
        },
      },
    },
    ...(userId ? { userId } : {}),
    ...(startDate || endDate ? { signedAt: signedAtFilter } : {}),
  };

  if (search) {
    where.OR = [
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [signers, totalItems] = await Promise.all([
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
        orderBy: [{ signedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          signatureCount: true,
          signedAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      }),
      // Count total signatures made today
      prisma.signatureLog.aggregate({
        where: {
          ...where,
          signedAt: {
            gte: todayStart,
          },
        },
        _sum: {
          signatureCount: true,
        },
      }),
      // Count total signatures made this month
      prisma.signatureLog.aggregate({
        where: {
          ...where,
          signedAt: {
            gte: monthStart,
          },
        },
        _sum: {
          signatureCount: true,
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
    },
    pagination: {
      totalItems,
      totalPages,
    },
    signers,
    signatures: signatures.map(serializeSignatureLog),
    summary: {
      activeSigners: activeSignerRows.length,
      monthCount: monthCount._sum.signatureCount || 0,
      todayCount: todayCount._sum.signatureCount || 0,
      totalItems,
    },
  };
}

export async function getSignatureLogById(session: SessionPayload, id: string) {
  await ensureSignatureAccess(session);

  const signature = await prisma.signatureLog.findFirst({
    where: {
      id,
      user: {
        memberships: {
          some: {
            agencyId: session.activeAgencyId,
            isActive: true,
          },
        },
      },
    },
    select: {
      id: true,
      signatureCount: true,
      signedAt: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
    },
  });

  if (!signature) {
    return null;
  }

  const formOptions = await getSignatureLogFormOptions(session);

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
      user: {
        memberships: {
          some: {
            agencyId: session.activeAgencyId,
            isActive: true,
          },
        },
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
      user: {
        memberships: {
          some: {
            agencyId: session.activeAgencyId,
            isActive: true,
          },
        },
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
