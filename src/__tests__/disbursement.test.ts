import request from "supertest";
import express, { Express } from "express";
import router from "../routes/disbursement";
import { supabase } from "../supabaseClient";

const app: Express = express();
app.use(express.json());
app.use("/disbursements", router);

describe("Disbursement Integration Tests", () => {
  let testDisbursementId: number;
  beforeAll(async () => {
    await supabase.from("disbursements").delete().neq("id", -1);
  });

  // --------------------------------------------------
  // POST /disbursements
  // --------------------------------------------------
  describe("POST /disbursements", () => {
    it("should create a real disbursement in the database", async () => {
      const newDisbursement = {
        name: "Office Supplies",
        transaction_date: new Date().toISOString(),
        amount: 150.75,
      };

      const res = await request(app)
        .post("/disbursements")
        .send(newDisbursement);

      if (res.status !== 201) {
        console.error("POST Error:", res.body);
      }

      expect(res.status).toBe(201);

      const { data } = await supabase
        .from("disbursements")
        .select("id")
        .eq("name", "Office Supplies")
        .order("id", { ascending: false })
        .limit(1)
        .single();
      
      testDisbursementId = data?.id;
      expect(testDisbursementId).toBeDefined();
    });

    it("should fail on missing fields", async () => {
      const res = await request(app)
        .post("/disbursements")
        .send({ name: "Incomplete Item" });

      expect(res.status).toBe(400);
    });
  });

  // --------------------------------------------------
  // GET /disbursements
  // --------------------------------------------------
  describe("GET /disbursements", () => {
    it("should return the list including the new item", async () => {
      const res = await request(app).get("/disbursements");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const exists = res.body.some((d: any) => d.id === testDisbursementId);
      expect(exists).toBe(true);
    });
  });

  // --------------------------------------------------
  // GET /disbursements/month
  // --------------------------------------------------
  describe("GET /disbursements/month", () => {
    it("should return rows for current month", async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const res = await request(app)
        .get(`/disbursements/month?month=${month}&year=${year}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // --------------------------------------------------
  // RPC Calls (Aggregation)
  // --------------------------------------------------
  describe("RPC Aggregation Tests", () => {
    it("should return monthly total from RPC", async () => {
      const now = new Date();
      const res = await request(app)
        .get(`/disbursements/total/month?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total");
    });

    it("should return yearly totals from RPC", async () => {
      const year = new Date().getFullYear();
      const res = await request(app)
        .get(`/disbursements/total/year?year=${year}`);

      expect(res.status).toBe(200);
      expect(res.body.monthly.length).toBe(12);
      expect(typeof res.body.annual_total).toBe("number");
    });
  });

  // --------------------------------------------------
  // DELETE /disbursements
  // --------------------------------------------------
  describe("DELETE /disbursements", () => {
    it("should delete the created disbursement", async () => {
      const res = await request(app)
        .delete("/disbursements")
        .send({ id: testDisbursementId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Disbursement deleted");

      // Verify deletion from DB
      const { data } = await supabase
        .from("disbursements")
        .select("id")
        .eq("id", testDisbursementId);
      
      expect(data?.length).toBe(0);
    });
  });
});