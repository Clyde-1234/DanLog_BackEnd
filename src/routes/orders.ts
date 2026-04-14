import express from "express";
import { supabase } from "../supabaseClient";

const router = express.Router();

// GET /orders (get all orders)
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("orders").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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

// Get all daily totals of both orders and disbursements for a given month and year
// GET /orders/month?month=5&year=2024
router.get("/daily-totals", async (req, res) => {
  const { month, year } = req.query;

  // ✅ validation
  if (!month || !year) {
    return res.status(400).json({
      error: "month and year are required",
    });
  }

  const monthNum = parseInt(month as string);
  const yearNum = parseInt(year as string);

  if (isNaN(monthNum) || isNaN(yearNum)) {
    return res.status(400).json({
      error: "month and year must be numbers",
    });
  }

  try {
    const { data, error } = await supabase.rpc("get_daily_totals", {
      month: monthNum,
      year: yearNum,
    });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    // ✅ Optional: fill missing days with 0
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const formatted: { [key: number]: number } = {};

    // initialize all days to 0
    for (let d = 1; d <= daysInMonth; d++) {
      formatted[d] = 0;
    }

    // fill actual values
    data.forEach((row: { day: string | number | Date; total: any; }) => {
      const day = new Date(row.day).getDate();
      formatted[day] = Number(row.total);
    });

    res.json({
      month: monthNum,
      year: yearNum,
      totals: formatted,
    });

  } catch (err) {
    res.status(500).json({
      error: "Unexpected server error",
    });
  }
});





//------------------------------------------------------------------------------------------


// Get the total of orders monthly
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

// Get the total of orders annually
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
  const { customer_name, total_weight, load, status, amount, id=null } = req.body;
  if (!customer_name || !total_weight || !load || !status || !amount) return res.status(400).json({ error: "All fields required" });

  const { data, error } = await supabase.from("orders").insert([{customer_name, total_weight, load, status, amount, id }]);
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


// Update order status
router.patch("/", async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) return res.status(400).json({ error: "ID and status required" });

  if (typeof id !== "number" || typeof status !== "string") {
    return res.status(400).json({ error: "Invalid data types" });
  }

  const { data, error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Order status updated"});
});

export default router;
