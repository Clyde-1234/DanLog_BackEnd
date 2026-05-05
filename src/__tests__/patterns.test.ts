import { SupabaseClientSingleton } from '../patterns/SupabaseClientSingleton';
import {
  ExpenseTotalStrategy,
  NetProfitStrategy,
  RevenueTotalStrategy,
  formatYearlyMonthlyTotals,
} from '../patterns/FinancialTotalStrategy';
import { LaundryRecordFactory } from '../patterns/LaundryRecordFactory';
import { LaundryReportFactory } from '../patterns/LaundryReportFactory';

describe('Software Component Design Patterns', () => {
  afterEach(() => {
    SupabaseClientSingleton.resetForTests();
  });

  it('Singleton returns the same Supabase client instance', () => {
    const fakeClient = { from: jest.fn() } as any;
    const createClient = jest.fn(() => fakeClient);

    const first = SupabaseClientSingleton.getInstance({
      url: 'http://localhost:54321',
      key: 'test-key',
      createClient,
    });
    const second = SupabaseClientSingleton.getInstance({
      url: 'http://localhost:54321',
      key: 'test-key',
      createClient,
    });

    expect(first).toBe(second);
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it('Revenue strategy calculates totals correctly', () => {
    const strategy = new RevenueTotalStrategy();

    expect(strategy.calculate([{ amount: 120 }, { amount: '80.50' }])).toBe(200.5);
  });

  it('Expense strategy calculates totals correctly', () => {
    const strategy = new ExpenseTotalStrategy();

    expect(strategy.calculate([{ amount: 25 }, { amount: '74.25' }])).toBe(99.25);
  });

  it('Net profit strategy subtracts expenses from revenue', () => {
    const strategy = new NetProfitStrategy();

    expect(strategy.calculate(500, 175.5)).toBe(324.5);
  });

  it('formats yearly monthly totals with 12 months and annual total', () => {
    const result = formatYearlyMonthlyTotals(
      2026,
      [
        { month: 1, monthly_total: '100' },
        { month: 3, monthly_total: 50 },
      ],
      new RevenueTotalStrategy()
    );

    expect(result).toEqual({
      year: 2026,
      monthly: [
        { month: 1, total: 100 },
        { month: 2, total: 0 },
        { month: 3, total: 50 },
        { month: 4, total: 0 },
        { month: 5, total: 0 },
        { month: 6, total: 0 },
        { month: 7, total: 0 },
        { month: 8, total: 0 },
        { month: 9, total: 0 },
        { month: 10, total: 0 },
        { month: 11, total: 0 },
        { month: 12, total: 0 },
      ],
      annual_total: 150,
    });
  });

  it('Factory creates order insert records without changing conversions', () => {
    const record = LaundryRecordFactory.createOrderRecord({
      customer_name: 'Test User',
      total_weight: '15.5',
      load: '5',
      status: 'pending',
      amount: '1500',
      id: 42,
    });

    expect(record).toEqual({
      customer_name: 'Test User',
      total_weight: 15.5,
      load: 5,
      status: 'pending',
      amount: 1500,
      id: 42,
    });
  });

  it('Factory creates disbursement insert records without changing payload fields', () => {
    const record = LaundryRecordFactory.createDisbursementRecord({
      name: 'Soap',
      amount: '99.50',
      transaction_date: '2026-05-05T00:00:00.000Z',
    });

    expect(record).toEqual({
      name: 'Soap',
      amount: '99.50',
      transaction_date: '2026-05-05T00:00:00.000Z',
    });
  });

  it('Report factory returns the correct report type', () => {
    expect(LaundryReportFactory.createReport('daily').type).toBe('daily');
    expect(LaundryReportFactory.createReport('monthly').type).toBe('monthly');
    expect(LaundryReportFactory.createReport('yearly').type).toBe('yearly');
  });
});