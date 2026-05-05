export interface AmountRow {
  amount?: number | string | null;
  total?: number | string | null;
  monthly_total?: number | string | null;
}

export interface FinancialTotalStrategy {
  calculate(rows: AmountRow[]): number;
}

function valueFrom(row: AmountRow): number {
  return Number(row.amount ?? row.total ?? row.monthly_total ?? 0);
}

export class RevenueTotalStrategy implements FinancialTotalStrategy {
  calculate(rows: AmountRow[]): number {
    return rows.reduce((sum, row) => sum + valueFrom(row), 0);
  }
}

export class ExpenseTotalStrategy implements FinancialTotalStrategy {
  calculate(rows: AmountRow[]): number {
    return rows.reduce((sum, row) => sum + valueFrom(row), 0);
  }
}

export class NetProfitStrategy {
  calculate(revenue: number, expenses: number): number {
    return revenue - expenses;
  }
}

export interface MonthlyTotalRow {
  month: number;
  monthly_total: number | string | null;
}

export function formatYearlyMonthlyTotals(
  year: number,
  rows: MonthlyTotalRow[],
  totalStrategy: FinancialTotalStrategy
) {
  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    total: 0,
  }));

  rows.forEach((row) => {
    if (row.month >= 1 && row.month <= 12) {
      monthly[row.month - 1].total = Number(row.monthly_total);
    }
  });

  return {
    year,
    monthly,
    annual_total: totalStrategy.calculate(monthly),
  };
}