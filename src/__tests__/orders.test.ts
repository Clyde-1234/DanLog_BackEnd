import request from "supertest";
import express, { Express } from "express";
import router from "../routes/orders";
import { supabase } from "../supabaseClient";

const app: Express = express();
app.use(express.json());
app.use("/orders", router);

describe("Orders Integration Tests", () => {
  let testOrderId: any;

  beforeAll(async () => {
    await supabase.from("orders").delete().neq("id", -1);
  });

  describe("POST /orders", () => {
    it("should create a real order and return it", async () => {
      const newOrder = {
        customer_name: "Test User",
        total_weight: "15.5",
        load: 5,
        status: "pending",
        amount: 1500,
      };

      const res = await request(app).post("/orders").send(newOrder);

      if (res.status !== 201) {
        console.error("POST Failed:", res.body);
      }

      expect(res.status).toBe(201);
    
      if (typeof res.body === 'string') {
          const { data } = await supabase.from("orders").select("id").limit(1).single();
          testOrderId = data?.id;
      } else {
          testOrderId = res.body.id;
      }
      
      expect(testOrderId).toBeDefined();
    });
  });

  describe("GET /orders", () => {
    it("should handle pagination response", async () => {
      const res = await request(app).get("/orders");
      expect(res.status).toBe(200);

      if (res.body.data) {
          expect(Array.isArray(res.body.data)).toBe(true);
      } else {
          expect(Array.isArray(res.body)).toBe(true);
      }
    });
  });

  describe("PATCH /orders", () => {
    it("should update status using the captured ID", async () => {
      expect(testOrderId).toBeDefined();

      const res = await request(app)
        .patch("/orders")
        .send({ id: testOrderId, status: "completed" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Order status updated");
    });
  });

  describe("DELETE /orders", () => {
    it("should delete the order", async () => {
      const res = await request(app)
        .delete("/orders")
        .send({ id: testOrderId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Order deleted");
    });
  });
});