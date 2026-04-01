import { Prisma, RecordType } from '@prisma/client';
import prisma from '../prisma/client';
import { NotFoundError } from '../utils/errors';
import { decimalToNumber } from '../utils/number';
import {
  CreateFinancialRecordInput,
  FinancialRecordFilterInput,
  UpdateFinancialRecordInput,
} from '../validators/financialRecordValidator';

interface FinancialRecordResponse {
  id: number;
  amount: number;
  type: RecordType;
  category: string;
  date: Date;
  notes: string | null;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

interface PaginatedFinancialRecords {
  records: FinancialRecordResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type FinancialRecordWithUser = Prisma.FinancialRecordGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        role: true;
      };
    };
  };
}>;

function mapFinancialRecord(record: FinancialRecordWithUser): FinancialRecordResponse {
  return {
    id: record.id,
    amount: decimalToNumber(record.amount),
    type: record.type,
    category: record.category,
    date: record.date,
    notes: record.notes,
    user: {
      id: record.user.id,
      email: record.user.email,
      role: record.user.role,
    },
  };
}

function buildWhere(filters: FinancialRecordFilterInput): Prisma.FinancialRecordWhereInput {
  const where: Prisma.FinancialRecordWhereInput = {};

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.category) {
    where.category = {
      contains: filters.category,
      mode: 'insensitive',
    };
  }

  if (filters.startDate || filters.endDate) {
    where.date = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };
  }

  if (filters.search) {
    where.OR = [
      {
        notes: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        category: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
}

async function createRecord(
  payload: CreateFinancialRecordInput,
  actorUserId: number,
): Promise<FinancialRecordResponse> {
  const ownerUserId = payload.userId ?? actorUserId;

  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { id: true },
  });

  if (!owner) {
    throw new NotFoundError('Associated user does not exist');
  }

  const record = await prisma.financialRecord.create({
    data: {
      amount: new Prisma.Decimal(payload.amount),
      type: payload.type,
      category: payload.category,
      date: payload.date,
      notes: payload.notes,
      userId: ownerUserId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return mapFinancialRecord(record);
}

async function listRecords(filters: FinancialRecordFilterInput): Promise<PaginatedFinancialRecords> {
  const page = filters.page;
  const limit = filters.limit;

  const where = buildWhere(filters);

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    records: records.map(mapFinancialRecord),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function updateRecord(
  id: number,
  payload: UpdateFinancialRecordInput,
): Promise<FinancialRecordResponse> {
  const existingRecord = await prisma.financialRecord.findUnique({ where: { id } });

  if (!existingRecord) {
    throw new NotFoundError('Financial record not found');
  }

  if (payload.userId !== undefined) {
    const owner = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true } });

    if (!owner) {
      throw new NotFoundError('Associated user does not exist');
    }
  }

  const data: Prisma.FinancialRecordUpdateInput = {};

  if (payload.amount !== undefined) {
    data.amount = new Prisma.Decimal(payload.amount);
  }

  if (payload.type !== undefined) {
    data.type = payload.type;
  }

  if (payload.category !== undefined) {
    data.category = payload.category;
  }

  if (payload.date !== undefined) {
    data.date = payload.date;
  }

  if (payload.notes !== undefined) {
    data.notes = payload.notes;
  }

  if (payload.userId !== undefined) {
    data.user = {
      connect: {
        id: payload.userId,
      },
    };
  }

  const updatedRecord = await prisma.financialRecord.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return mapFinancialRecord(updatedRecord);
}

async function deleteRecord(id: number): Promise<void> {
  const existingRecord = await prisma.financialRecord.findUnique({ where: { id }, select: { id: true } });

  if (!existingRecord) {
    throw new NotFoundError('Financial record not found');
  }

  await prisma.financialRecord.delete({ where: { id } });
}

export const financialRecordService = {
  createRecord,
  listRecords,
  updateRecord,
  deleteRecord,
};
