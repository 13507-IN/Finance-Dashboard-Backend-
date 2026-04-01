import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { decimalToNumber } from '../utils/number';
import { DashboardQueryInput } from '../validators/dashboardValidator';

interface DashboardAnalytics {
  totals: {
    income: number;
    expenses: number;
    netBalance: number;
  };
  categoryWiseTotals: Array<{
    category: string;
    type: 'INCOME' | 'EXPENSE';
    total: number;
  }>;
  recentTransactions: Array<{
    id: number;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    date: Date;
    notes: string | null;
    userId: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
  }>;
}

function buildDateWhere(filters: DashboardQueryInput): Prisma.FinancialRecordWhereInput {
  if (!filters.startDate && !filters.endDate) {
    return {};
  }

  return {
    date: {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    },
  };
}

async function getAnalytics(filters: DashboardQueryInput): Promise<DashboardAnalytics> {
  const dateWhere = buildDateWhere(filters);

  const [incomeAgg, expenseAgg, categoryGroups, recentTransactions, monthlySourceRecords] =
    await Promise.all([
      prisma.financialRecord.aggregate({
        where: {
          ...dateWhere,
          type: 'INCOME',
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.financialRecord.aggregate({
        where: {
          ...dateWhere,
          type: 'EXPENSE',
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.financialRecord.groupBy({
        by: ['category', 'type'],
        where: dateWhere,
        _sum: {
          amount: true,
        },
        orderBy: {
          category: 'asc',
        },
      }),
      prisma.financialRecord.findMany({
        where: dateWhere,
        orderBy: {
          date: 'desc',
        },
        take: 5,
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          date: true,
          notes: true,
          userId: true,
        },
      }),
      prisma.financialRecord.findMany({
        where: dateWhere,
        orderBy: {
          date: 'asc',
        },
        select: {
          amount: true,
          type: true,
          date: true,
        },
      }),
    ]);

  const totalIncome = decimalToNumber(incomeAgg._sum.amount);
  const totalExpenses = decimalToNumber(expenseAgg._sum.amount);

  const categoryWiseTotals = categoryGroups.map((group) => ({
    category: group.category,
    type: group.type,
    total: decimalToNumber(group._sum.amount),
  }));

  // Prisma does not provide month-bucket groupBy out of the box, so we aggregate in-memory.
  const monthlyMap = new Map<string, { totalIncome: number; totalExpenses: number }>();

  for (const record of monthlySourceRecords) {
    const month = `${record.date.getUTCFullYear()}-${String(record.date.getUTCMonth() + 1).padStart(2, '0')}`;

    const current = monthlyMap.get(month) ?? {
      totalIncome: 0,
      totalExpenses: 0,
    };

    const amount = decimalToNumber(record.amount);

    if (record.type === 'INCOME') {
      current.totalIncome += amount;
    } else {
      current.totalExpenses += amount;
    }

    monthlyMap.set(month, current);
  }

  const monthlyTrends = Array.from(monthlyMap.entries()).map(([month, values]) => ({
    month,
    totalIncome: values.totalIncome,
    totalExpenses: values.totalExpenses,
    netBalance: values.totalIncome - values.totalExpenses,
  }));

  return {
    totals: {
      income: totalIncome,
      expenses: totalExpenses,
      netBalance: totalIncome - totalExpenses,
    },
    categoryWiseTotals,
    recentTransactions: recentTransactions.map((record) => ({
      id: record.id,
      amount: decimalToNumber(record.amount),
      type: record.type,
      category: record.category,
      date: record.date,
      notes: record.notes,
      userId: record.userId,
    })),
    monthlyTrends,
  };
}

export const dashboardService = {
  getAnalytics,
};
