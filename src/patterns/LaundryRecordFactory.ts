export interface OrderRequestBody {
  customer_name: string;
  total_weight: number | string;
  load: number | string;
  status: string;
  amount: number | string;
  id?: number;
}

export interface DisbursementRequestBody {
  name: string;
  amount: number | string;
  transaction_date: string;
}

export class LaundryRecordFactory {
  static createOrderRecord(body: OrderRequestBody) {
    const record: any = {
      customer_name: body.customer_name,
      total_weight: Number(body.total_weight),
      load: Number(body.load),
      status: body.status,
      amount: Number(body.amount),
    };

    if (body.id) record.id = body.id;

    return record;
  }

  static createDisbursementRecord(body: DisbursementRequestBody) {
    return {
      name: body.name,
      amount: body.amount,
      transaction_date: body.transaction_date,
    };
  }
}