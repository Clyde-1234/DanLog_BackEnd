import request from "supertest";
import express, { Express } from "express";
import router from "../routes/checkList";
import { supabase } from "../supabaseClient";

const app: Express = express();
app.use(express.json());
app.use("/checkList", router);

describe("CheckList Integration Tests", () => {
  let testTaskId: number;

  // Clean the table before starting
  beforeAll(async () => {
    const { error } = await supabase.from("check_list").delete().neq("id", -1);
    if (error) console.error("Cleanup error:", error.message);
  });

  // --------------------------------------------------
  // POST /checkList
  // --------------------------------------------------
  describe("POST /checkList", () => {
    it("should create a new task in the database", async () => {
      const newTask = { task: "Integration Test Task", is_done: false };
      
      const res = await request(app).post("/checkList").send(newTask);

      if (res.status !== 201) {
        console.log("Debug POST Error:", res.body);
      }

      expect(res.status).toBe(201);
      // Assuming your route returns { message: "Task created", data: { id: ... } }
      // Or we fetch it manually if it doesn't return the ID
      const { data } = await supabase
        .from("check_list")
        .select("id")
        .eq("task", "Integration Test Task")
        .single();
      
      testTaskId = data?.id;
      expect(testTaskId).toBeDefined();
    });

    it("should return 400 for invalid input", async () => {
      const res = await request(app).post("/checkList").send({ task: "Missing is_done" });
      expect(res.status).toBe(400);
    });
  });

  // --------------------------------------------------
  // GET /checkList
  // --------------------------------------------------
  describe("GET /checkList", () => {
    it("should return all check list items from the DB", async () => {
      const res = await request(app).get("/checkList");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((item: any) => item.id === testTaskId)).toBe(true);
    });
  });

  // --------------------------------------------------
  // PATCH /checkList
  // --------------------------------------------------
  describe("PATCH /checkList", () => {
    it("should update task status in the DB", async () => {
      const res = await request(app)
        .patch("/checkList")
        .send({ id: testTaskId, is_done: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Task updated");

      // Verify DB state
      const { data } = await supabase
        .from("check_list")
        .select("is_done")
        .eq("id", testTaskId)
        .single();
      
      expect(data?.is_done).toBe(true);
    });
  });

  // --------------------------------------------------
  // DELETE /checkList
  // --------------------------------------------------
  describe("DELETE /checkList", () => {
    it("should delete a task from the DB", async () => {
      const res = await request(app)
        .delete("/checkList")
        .send({ id: testTaskId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Task deleted");

      // Verify it is gone
      const { data } = await supabase
        .from("check_list")
        .select("*")
        .eq("id", testTaskId);
      
      expect(data?.length).toBe(0);
    });

    it("should return 400 for missing id", async () => {
      const res = await request(app).delete("/checkList").send({});
      expect(res.status).toBe(400);
    });
  });
});