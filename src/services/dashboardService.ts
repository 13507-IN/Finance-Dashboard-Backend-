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

interface MonthlyTrendRow {
  month: Date;
  total_income: Prisma.Decimal | null;
  total_expenses: Prisma.Decimal | null;
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

  const monthFilters: Prisma.Sql[] = [];
  if (filters.startDate) {
    monthFilters.push(Prisma.sql`"date" >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    monthFilters.push(Prisma.sql`"date" <= ${filters.endDate}`);
  }

  const monthlyWhereClause =
    monthFilters.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(monthFilters, ' AND ')}`
      : Prisma.empty;

  const [incomeAgg, expenseAgg, categoryGroups, recentTransactions, monthlyTrendRows] =
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
        by: ['categoryId', 'type'],
        where: dateWhere,
        _sum: {
          amount: true,
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
          categoryId: true,
          category: { select: { name: true } },
          date: true,
          notes: true,
          userId: true,
        },
      }),
      prisma.$queryRaw<MonthlyTrendRow[]>(Prisma.sql`
        SELECT
          date_trunc('month', "date") AS month,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS total_expenses
        FROM "financial_records"
        ${monthlyWhereClause}
        GROUP BY 1
        ORDER BY 1 ASC
      `),
    ]);

  const totalIncome = decimalToNumber(incomeAgg._sum.amount);
  const totalExpenses = decimalToNumber(expenseAgg._sum.amount);

  const categoryIds = [...new Set(categoryGroups.map((g) => g.categoryId))];
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoryWiseTotals = categoryGroups.map((group) => ({
    category: categoryMap.get(group.categoryId) || 'Unknown',
    type: group.type,
    total: decimalToNumber(group._sum.amount),
  })).sort((a, b) => a.category.localeCompare(b.category));

  const monthlyTrends = monthlyTrendRows.map((row) => {
    const bucketDate = row.month instanceof Date ? row.month : new Date(row.month);
    const month = `${bucketDate.getUTCFullYear()}-${String(bucketDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const totalIncome = decimalToNumber(row.total_income);
    const totalExpenses = decimalToNumber(row.total_expenses);

    return {
      month,
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
    };
  });

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
      category: record.category?.name || 'Unknown',
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
