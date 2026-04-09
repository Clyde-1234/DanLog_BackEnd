import request from "supertest";
import express from "express";
import router from "../routes/orders";
import { supabase } from "../supabaseClient";

jest.mock("../supabaseClient", () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
  };

  return {
    supabase: {
      from: jest.fn(() => mockQuery),
      rpc: jest.fn(),
    },
  };
});

const app = express();
app.use(express.json());
app.use("/orders", router);

beforeEach(() => {
  jest.clearAllMocks();
});

// --------------------------------------------------
// GET /orders
// --------------------------------------------------
describe("GET /orders", () => {
  it("should return all orders", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      }),
    });

    const res = await request(app).get("/orders");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("should handle error", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Error" },
      }),
    });

    const res = await request(app).get("/orders");

    expect(res.status).toBe(500);
  });
});


// --------------------------------------------------
// GET /orders/month
// --------------------------------------------------
describe("GET /orders/month", () => {
  it("should return rows for given month", async () => {
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockChain);

    const res = await request(app)
      .get("/orders/month?month=5&year=2024");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1 }]);
  });
});


// --------------------------------------------------
// GET /orders/daily-totals
// --------------------------------------------------
describe("GET /orders/daily-totals", () => {
  it("should return formatted totals", async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{ day: "2024-05-01", total: 100 }],
      error: null,
    });

    const res = await request(app)
      .get("/orders/daily-totals?month=5&year=2024");

    expect(res.status).toBe(200);
    expect(res.body.month).toBe(5);
    expect(res.body.totals[1]).toBe(100);
  });

  it("should fail on missing params", async () => {
    const res = await request(app).get("/orders/daily-totals");

    expect(res.status).toBe(400);
  });

  it("should handle rpc error", async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: "Error" },
    });

    const res = await request(app)
      .get("/orders/daily-totals?month=5&year=2024");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error");
  });
});


// --------------------------------------------------
// GET /orders/total/month
// --------------------------------------------------
describe("GET /orders/total/month", () => {
  it("should return monthly total", async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: 500,
      error: null,
    });

    const res = await request(app)
      .get("/orders/total/month?month=5&year=2024");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(500);
  });
});


// --------------------------------------------------
// GET /orders/total/year
// --------------------------------------------------
describe("GET /orders/total/year", () => {
  it("should return monthly + annual totals", async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        { month: 1, monthly_total: 100 },
        { month: 2, monthly_total: 200 },
      ],
      error: null,
    });

    const res = await request(app)
      .get("/orders/total/year?year=2024");

    expect(res.status).toBe(200);
    expect(res.body.monthly.length).toBe(12);
    expect(res.body.annual_total).toBe(300);
  });
});


// --------------------------------------------------
// POST /orders
// --------------------------------------------------
describe("POST /orders", () => {
  it("should create an order", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    const res = await request(app).post("/orders").send({
      customer_name: "Test",
      total_weight: 10,
      load: 5,
      status: "pending",
      amount: 100,
    });

    expect(res.status).toBe(201);
  });

  it("should fail on missing fields", async () => {
    const res = await request(app).post("/orders").send({});

    expect(res.status).toBe(400);
  });

  it("should fail on invalid types", async () => {
    const res = await request(app).post("/orders").send({
      customer_name: 123,
      total_weight: "bad",
      load: 5,
      status: "pending",
      amount: 100,
    });

    expect(res.status).toBe(400);
  });
});


// --------------------------------------------------
// DELETE /orders
// --------------------------------------------------
describe("DELETE /orders", () => {
  it("should delete an order", async () => {
    const mockChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockChain);

    const res = await request(app)
      .delete("/orders")
      .send({ id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Order deleted");
  });

  it("should handle errors", async () => {
    const mockChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Error" },
      }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockChain);

    const res = await request(app)
      .delete("/orders")
      .send({ id: 1 });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error");
  });
});


// --------------------------------------------------
// PATCH /orders
// --------------------------------------------------
describe("PATCH /orders", () => {
  it("should update order status", async () => {
    const mockChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockChain);

    const res = await request(app)
      .patch("/orders")
      .send({ id: 1, status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Order status updated");
  });

  it("should validate input", async () => {
    const res = await request(app)
      .patch("/orders")
      .send({});

    expect(res.status).toBe(400);
  });

  it("should handle errors", async () => {
    const mockChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Error" },
      }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockChain);

    const res = await request(app)
      .patch("/orders")
      .send({ id: 1, status: "pending" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error");
  });
});