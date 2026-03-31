// tests/disbursement.test.ts
import request from "supertest";
import express from "express";
import router from "../routes/disbursement";
import { supabase } from "../supabaseClient";

jest.mock("../supabaseClient", () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
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
app.use("/disbursements", router);

describe("GET /disbursements", () => {
  it("should return all disbursements", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ id: 1, name: "Test" }],
        error: null,
      }),
    });

    const res = await request(app).get("/disbursements");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe("GET /disbursements/month", () => {
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
      .get("/disbursements/month?month=1&year=2024");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1 }]);
  });
});

describe("GET /disbursements/total/month", () => {
  it("should return monthly total", async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: 5000,
      error: null,
    });

    const res = await request(app)
      .get("/disbursements/total/month?month=1&year=2024");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5000);
  });
});

describe("GET /disbursements/total/year", () => {
  it("should return monthly + annual totals", async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        { month: 1, monthly_total: 100 },
        { month: 2, monthly_total: 200 },
      ],
      error: null,
    });

    const res = await request(app)
      .get("/disbursements/total/year?year=2024");

    expect(res.status).toBe(200);
    expect(res.body.monthly.length).toBe(12);
    expect(res.body.annual_total).toBe(300);
  });
});

describe("POST /disbursements", () => {
  it("should create a disbursement", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    const res = await request(app)
      .post("/disbursements")
      .send({
        name: "Item",
        unit: 2,
        price_per_unit: 50,
        total_price: 100,
      });

    expect(res.status).toBe(201);
  });

  it("should fail on missing fields", async () => {
    const res = await request(app)
      .post("/disbursements")
      .send({ name: "Item" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /disbursements", () => {
  it("should delete a disbursement", async () => {
    const mockChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockChain);

    const res = await request(app)
      .delete("/disbursements")
      .send({ id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Disbursement deleted");
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
      .delete("/disbursements")
      .send({ id: 1 });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error");
  });

});