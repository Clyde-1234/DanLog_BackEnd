import request from "supertest";
import express from "express";
import router from "../routes/checkList";
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
app.use("/checkList", router);

beforeEach(() => {
  jest.clearAllMocks();
});

// --------------------------------------------------
// GET /checkList
// --------------------------------------------------

describe("GET /checkList", () => {
  it("should return all check list items", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
            data: [
                {id: 1, task: "Task 1", is_done: false},
                {id: 2, task: "Task 2", is_done: true},
            ],
            error: null
        })
    });

    const res = await request(app).get("/checkList");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].task).toBe("Task 1");
    expect(res.body[1].is_done).toBe(true);
    });
});

describe("POST /checkList", () => {
    it("should create a new task", async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            insert: jest.fn().mockResolvedValue({
                data: null,
                error: null,
            }),
        });

        const res = await request(app).post("/checkList").send({ task: "New Task", is_done: false });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Task created");

    });

    it("should return 400 for invalid input", async () => {
        const res = await request(app).post("/checkList").send({ task: "Task without is_done" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid input");
    });

    it("should handle database error", async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            insert: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
            }),
        });

        const res = await request(app).post("/checkList").send({ task: "Task", is_done: false });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("Database error");
    });
});

describe("PATCH /checkList", () => {
    it("should update task status", async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
                data: [{ id: 1, task: "Task", is_done: true }],
                error: null,
            }),
        });

        const res = await request(app).patch("/checkList").send({ id: 1, is_done: true });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Task updated");

    });
});

describe("DELETE /checkList", () => {
    it("should delete a task", async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
            }),
        });

        const res = await request(app).delete("/checkList").send({ id: 1 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Task deleted");

    });

    it("should handle input error", async () => {
        const res = await request(app).delete("/checkList").send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid input");
    });

    it("should handle database error", async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
            }),
        });

        const res = await request(app).delete("/checkList").send({ id: 1 });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("Database error");
    });

});