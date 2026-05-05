# Software Component Design Patterns

## Singleton Pattern
- Used in `SupabaseClientSingleton.ts` and exported through `src/supabaseClient.ts` as the existing `supabase` constant.
- It fits LaundryLog Lite because every route should share one configured Supabase client for orders, checklist items, and disbursements.
- Defense demo: show that existing imports still use `supabase`, but creation is controlled by one singleton class.

## Strategy Pattern
- Used in `FinancialTotalStrategy.ts` for revenue totals, expense totals, net profit, and yearly monthly total formatting.
- It fits LaundryLog Lite because revenue, disbursement expenses, and profit are related calculations that can vary while the route response stays the same.
- Defense demo: show `RevenueTotalStrategy`, `ExpenseTotalStrategy`, and `NetProfitStrategy`, then show yearly routes using the formatter without changing API output.

## Factory Method Pattern
- Used in `LaundryReportFactory.ts` to create daily, monthly, and yearly report objects.
- `LaundryRecordFactory.ts` also keeps POST insert records simple and consistent for orders and disbursements.
- It fits LaundryLog Lite because reports and database records are created from known business types instead of scattered object construction.
- Defense demo: ask the factory for `daily`, `monthly`, or `yearly` and show that the correct report object is returned.