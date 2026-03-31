import express from "express";
import { supabase } from "../supabaseClient";

const router = express.Router();

// GET /orders (get all orders)
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("orders").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get("/status", async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(String(page));
  const limitNum = parseInt(String(limit));

  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    const statuses = String(status).split(",");
    query = query.in("status", statuses);
  } else {
    query = query.in("status", ["pending", "in queue", "completed"]);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    page: pageNum,
    limit: limitNum,
    data,
  });
});


// GET /orders/month?month=5&year=2024
router.get("/month", async (req, res) => {
  const { month, year } = req.query;

  const m = Number(month);
  const y = Number(year);

  // Start of month
  const start = new Date(y, m - 1, 1);

  // Start of next month
  const end = new Date(y, m, 1);

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (error) return res.status(500).json({ error });

  res.json(data);
});







//------------------------------------------------------------------------------------------



// GET /orders/total/month?month=5&year=2024
router.get("/total/month", async (req, res) => {
    const { month, year } = req.query;

    const { data, error } = await supabase.rpc("get_monthly_order_total", {
        month_num: Number(month),
        year_num: Number(year),
    });

    if (error) return res.status(500).json({ error });

    res.json({ total: data });
});

// GET /disbursement/total/year?year=2024
router.get("/total/year", async (req, res) => {
  const { year } = req.query;

  const { data, error } = await supabase.rpc(
    "get_yearly_monthly_order_totals",
    { year_num: Number(year) }
  );

  if (error) return res.status(500).json({ error });

  // Fill missing months (important)
  const fullYear = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    total: 0,
  }));

  data.forEach((row: { month: number; monthly_total: any; }) => {
    fullYear[row.month - 1].total = Number(row.monthly_total);
  });

  // Annual total
  const annualTotal = fullYear.reduce((sum, m) => sum + m.total, 0);

  res.json({
    year: Number(year),
    monthly: fullYear,
    annual_total: annualTotal,
  });
});

// POST a new order
router.post("/", async (req, res) => {
  const { daily_id, customer_name, total_weight, load, status, amount } = req.body;
  if (!daily_id || !customer_name || !total_weight || !load || !status || !amount) return res.status(400).json({ error: "All fields required" });

  if (typeof daily_id !== "string" || typeof customer_name !== "string" || typeof total_weight !== "number" || typeof load !== "number" || typeof status !== "string" || typeof amount !== "number") {
    return res.status(400).json({ error: "Invalid data types" });
  }

  const { data, error } = await supabase.from("orders").insert([{ daily_id, customer_name, total_weight, load, status, amount }]);
  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json("Order created successfully");

});

// DELETE disbursement by ID
router.delete("/", async (req, res) => {
  const { id } = req.body;
  const { data, error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Order deleted"});
});

export default router;