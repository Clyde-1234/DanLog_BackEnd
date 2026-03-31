import request from "supertest";
import express from "express";
import router from "../routes/orders";
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
app.use("/orders", router);

describe("GET /orders", () => {
  it("should return all orders", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
        data: [{ id: 1, name: "Test" }],
        error: null,
      }),
    });

    const res = await request(app).get("/orders");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});
