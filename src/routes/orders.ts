import express from "express";
import { supabase } from "../supabaseClient";

const router = express.Router();

// GET /orders (get all orders)
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("orders").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get("/", async (req, res) => {
  const { limit = 20, cursorCreatedAt, cursorId } = req.query;

  const limitNum = parseInt(  limit as string, 10);

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limitNum);

  if (cursorCreatedAt && cursorId) {
    query = query.or(
      `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
    );
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const lastItem = data[data.length - 1];

  res.json({
    data,
    nextCursor: lastItem
      ? {
          created_at: lastItem.created_at,
          id: lastItem.id,
        }
      : null,
    hasMore: data.length === limitNum,
  });
});


//Get the latest order made
router.get("/latest", async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// at a given month and year, get all orders within ra
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

// Get a summary of orders by status
// GET /orders/status-summary?status=completed
router.get("/status-summary", async (req, res) => {
  const { status } = req.query;

  if (!status) {
    return res.status(400).json({
      error: "status is required",
    });
  }

  try {
    const { data, error, count } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
      .eq("status", status);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json({
      status,
      count,
      data,
    });

  } catch (err) {
    res.status(500).json({
      error: "Unexpected server error",
    });
  }
});


// Get all orders for a specific date
// GET /orders/by-date?date=2024-05-01
router.get("/by-date", async (req, res) => {
  const { date } = req.query;

  // ✅ validation
  if (!date) {
    return res.status(400).json({
      error: "date is required (format: YYYY-MM-DD)",
    });
  }

  try {
    // define start and end of the day
    const start = `${date}T00:00:00`;
    const end = `${date}T23:59:59`;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json({
      date,
      count: data.length,
      data,
    });

  } catch (err) {
    res.status(500).json({
      error: "Unexpected server error",
    });
  }
});

// Get all daily totals of both orders and disbursements for a given month and year
// GET /orders/daily-orders?month=5&year=2024
router.get("/daily-orders", async (req, res) => {
  const { month, year } = req.query;

  // ✅ validation
  if (!month || !year) {
    return res.status(400).json({
      error: "month and year are required",
    });
  }

  const monthNum = parseInt(month as string, 10);
  const yearNum = parseInt(year as string, 10);

  if (isNaN(monthNum) || isNaN(yearNum)) {
    return res.status(400).json({
      error: "month and year must be numbers",
    });
  }

  try {
    const { data, error } = await supabase.rpc(
      "get_daily_order_totals",
      {
        month: monthNum,
        year: yearNum,
      }
    );

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json({
      month: monthNum,
      year: yearNum,
      data, // [{ day: '2026-04-01', total: 500 }, ...]
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
  let { customer_name, total_weight, load, status, amount, id=null } = req.body;
  if (!customer_name || !total_weight || !load || !status || !amount) return res.status(400).json({ error: "All fields required" });

  if (typeof customer_name !== "string" || typeof Number(total_weight) !== "number" || typeof Number(load) !== "number" || typeof status !== "string" || typeof Number(amount) !== "number") {
    return res.status(400).json({ error: "Invalid data types" });
  }

  total_weight = Number(total_weight)
  load = Number(load);
  amount = Number(amount);
  
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