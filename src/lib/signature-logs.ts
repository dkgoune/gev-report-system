import type { Role } from "@/generated/prisma/enums";
import { canAccessPlatform } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";
import { buildScopedUserWhere, listScopedUsers } from "@/lib/user-scope";

export const SIGNATURE_PAGE_SIZES = [10, 20, 50] as const;

const SIGNATURE_SIGNER_ROLES: Role[] = [
  "admin",
  "leader",
  "subleader",
  "agent",
];

export type SignatureAgentOption = {
  id: string;
  fullName: string;
  role: Role;
  username: string;
};

export type SignatureLogItem = {
  busArrivalTime: string | null;
  createdAt: string;
  id: string;
  signedAt: string | null;
  slipNumber: string;
  user: SignatureAgentOption;
};

export type SignatureLogFilters = {
  endDate: string;
  page: number;
  pageSize: number;
  search: string;
  startDate: string;
  userId: string;
};

export type SignatureLogListPayload = {
  signers: SignatureAgentOption[];
  filters: SignatureLogFilters;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  signatures: SignatureLogItem[];
  summary: {
    activeSigners: number;
    monthCount: number;
    todayCount: number;
    totalItems: number;
  };
};

export type SignatureFormState = {
  busArrivalTime: string;
  signedAt: string;
  slipNumber: string;
  userId: string;
};

type SignatureListQuery = {
  from?: string;
  page?: string;
  pageSize?: string;
  q?: string;
  to?: string;
  userId?: string;
};

const signatureSelect = {
  busArrivalTime: true,
  id: true,
  slipNumber: true,
  signedAt: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      role: true,
      username: true,
    },
  },
};

function assertSignatureAccess(session: SessionPayload) {
  if (!canAccessPlatform(session.role)) {
    throw new Error("Accès refusé au module de signatures.");
  }
}

function normalizePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePageSize(value: string | undefined) {
  const parsed = Number(value);
  return SIGNATURE_PAGE_SIZES.includes(
    parsed as (typeof SIGNATURE_PAGE_SIZES)[number]
  )
    ? parsed
    : SIGNATURE_PAGE_SIZES[0];
}

function normalizeDateOnly(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "";
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return trimmed;
}

function normalizeDateTime(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  const date = new Date(`${normalized}.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function normalizeDateTimeLocal(value: Date) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  const hours = String(value.getUTCHours()).padStart(2, "0");
  const minutes = String(value.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function serializeSignature<
  T extends {
    busArrivalTime?: Date | null;
    createdAt: Date;
    signedAt: Date | null;
  },
>(signature: T) {
  return {
    ...signature,
    busArrivalTime: signature.busArrivalTime
      ? signature.busArrivalTime.toISOString()
      : null,
    createdAt: signature.createdAt.toISOString(),
    signedAt: signature.signedAt ? signature.signedAt.toISOString() : null,
  };
}

async function getSignerOptions(session: SessionPayload) {
  return listScopedUsers(session, SIGNATURE_SIGNER_ROLES) satisfies Promise<
    SignatureAgentOption[]
  >;
}

async function assertValidSigner(session: SessionPayload, userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      ...buildScopedUserWhere(session, SIGNATURE_SIGNER_ROLES),
      id: userId,
    },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Signataire invalide.");
  }
}

export async function listSignatureLogs(
  session: SessionPayload,
  query: SignatureListQuery
): Promise<SignatureLogListPayload> {
  assertSignatureAccess(session);

  const search = (query.q || "").trim();
  const userId = query.userId?.trim() || "";
  const startDate = normalizeDateOnly(query.from);
  const endDate = normalizeDateOnly(query.to);
  const pageSize = normalizePageSize(query.pageSize);
  const where: Record<string, unknown> = {};

  if (userId) {
    where.userId = userId;
  }

  if (search) {
    where.OR = [
      { slipNumber: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (startDate || endDate) {
    where.signedAt = {};

    if (startDate) {
      (where.signedAt as Record<string, unknown>).gte = new Date(
        `${startDate}T00:00:00.000Z`
      );
    }

    if (endDate) {
      (where.signedAt as Record<string, unknown>).lte = new Date(
        `${endDate}T23:59:59.999Z`
      );
    }
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const todayStart = new Date(`${today}T00:00:00.000Z`);
  const todayEnd = new Date(`${today}T23:59:59.999Z`);
  const monthStart = new Date(`${month}-01T00:00:00.000Z`);
  const [signers, activeSigners, totalItems, todayCount, monthCount] =
    await Promise.all([
      getSignerOptions(session),
      prisma.user.count({
        where: buildScopedUserWhere(session, SIGNATURE_SIGNER_ROLES),
      }),
      prisma.signatureLog.count({ where }),
      prisma.signatureLog.count({
        where: {
          ...where,
          signedAt: {
            ...(where.signedAt as Record<string, unknown> | undefined),
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.signatureLog.count({
        where: {
          ...where,
          signedAt: {
            ...(where.signedAt as Record<string, unknown> | undefined),
            gte: monthStart,
          },
        },
      }),
    ]);

  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const page = Math.min(normalizePage(query.page), totalPages);
  const signatures = await prisma.signatureLog.findMany({
    where,
    orderBy: [{ signedAt: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: signatureSelect,
  });

  return {
    signers,
    filters: {
      endDate,
      page,
      pageSize,
      search,
      startDate,
      userId,
    },
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
    signatures: signatures.map(serializeSignature),
    summary: {
      activeSigners,
      monthCount,
      todayCount,
      totalItems,
    },
  };
}

export async function getSignatureLogFormOptions(session: SessionPayload) {
  assertSignatureAccess(session);
  return getSignerOptions(session);
}

export async function getSignatureLogById(session: SessionPayload, id: string) {
  assertSignatureAccess(session);

  const [signature, signers] = await Promise.all([
    prisma.signatureLog.findUnique({
      where: { id },
      select: signatureSelect,
    }),
    getSignerOptions(session),
  ]);

  if (!signature) {
    return null;
  }

  return {
    signers,
    signature: serializeSignature(signature),
  };
}

export async function createSignatureLog(
  session: SessionPayload,
  body: Partial<SignatureFormState>
) {
  assertSignatureAccess(session);

  const userId = body.userId?.trim();
  const slipNumber = body.slipNumber?.trim();
  const busArrivalTime = normalizeDateTime(body.busArrivalTime);
  const signedAt = normalizeDateTime(body.signedAt);

  if (!userId || !slipNumber) {
    throw new Error("Signataire et numéro de bordereau sont obligatoires.");
  }

  await assertValidSigner(session, userId);

  const signature = await prisma.signatureLog.create({
    data: {
      busArrivalTime,
      slipNumber,
      ...(signedAt ? { signedAt } : {}),
      userId,
    },
    select: signatureSelect,
  });

  return {
    signature: serializeSignature(signature),
  };
}

export async function updateSignatureLog(
  session: SessionPayload,
  id: string,
  body: Partial<SignatureFormState>
) {
  assertSignatureAccess(session);

  const userId = body.userId?.trim();
  const slipNumber = body.slipNumber?.trim();
  const busArrivalTime = normalizeDateTime(body.busArrivalTime);
  const signedAt = normalizeDateTime(body.signedAt);

  if (!userId || !slipNumber) {
    throw new Error("Signataire et numéro de bordereau sont obligatoires.");
  }

  await assertValidSigner(session, userId);

  try {
    const signature = await prisma.signatureLog.update({
      where: { id },
      data: {
        busArrivalTime,
        slipNumber,
        ...(signedAt ? { signedAt } : { signedAt: null }),
        userId,
      },
      select: signatureSelect,
    });

    return {
      signature: serializeSignature(signature),
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return null;
    }

    throw error;
  }
}

export async function deleteSignatureLog(session: SessionPayload, id: string) {
  assertSignatureAccess(session);

  try {
    await prisma.signatureLog.delete({ where: { id } });
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return false;
    }

    throw error;
  }
}

export function getDefaultSignatureFormState() {
  return {
    busArrivalTime: "",
    signedAt: "",
    slipNumber: "",
    userId: "",
  } satisfies SignatureFormState;
}

export function formatSignatureDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return normalizeDateTimeLocal(date);
}
