export type ReportType = 'daily' | 'monthly' | 'yearly';

export interface LaundryReport {
  type: ReportType;
  label: string;
}

export class DailyReport implements LaundryReport {
  type: ReportType = 'daily';
  label = 'Daily laundry revenue and expense report';
}

export class MonthlyReport implements LaundryReport {
  type: ReportType = 'monthly';
  label = 'Monthly laundry revenue and expense report';
}

export class YearlyReport implements LaundryReport {
  type: ReportType = 'yearly';
  label = 'Yearly laundry revenue and expense report';
}

export class LaundryReportFactory {
  static createReport(type: ReportType): LaundryReport {
    switch (type) {
      case 'daily':
        return new DailyReport();
      case 'monthly':
        return new MonthlyReport();
      case 'yearly':
        return new YearlyReport();
      default: {
        const unsupported: never = type;
        throw new Error(`Unsupported report type: ${unsupported}`);
      }
    }
  }
}