import express from "express";
import { supabase } from "../supabaseClient";
import { create } from "node:domain";

const router = express.Router();

// GET /disbursement
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("disbursements").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}); 

// at a given month and year, get all disbursements within range
// GET /disbursement/month?month=5&year=2024
router.get("/month", async (req, res) => {
  const { month, year } = req.query;

  const m = Number(month);
  const y = Number(year);

  // Start of month
  const start = new Date(y, m - 1, 1);

  // Start of next month
  const end = new Date(y, m, 1);

  const { data, error } = await supabase
    .from("disbursements")
    .select("*")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (error) return res.status(500).json({ error });

  res.json(data);
});

// at a given month and year, get total disbursements within that specific month
// GET /disbursements/total/month?month=5&year=2024
router.get("/total/month", async (req, res) => {
    const { month, year } = req.query;

    const { data, error } = await supabase.rpc("get_monthly_disbursements_total", {
        month_num: Number(month),
        year_num: Number(year),
    });

    if (error) return res.status(500).json({ error });

    res.json({ total: data });
});

// at a given year, get total disbursements for each month of that year
// GET /disbursement/total/year?year=2024
router.get("/total/year", async (req, res) => {
  const { year } = req.query;

  const { data, error } = await supabase.rpc(
    "get_yearly_monthly_disbursments_totals",
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

// POST a new disbursement
router.post("/", async (req, res) => {
  const { name, unit, amount } = req.body;
  if (!name || !unit || !amount) return res.status(400).json({ error: "All fields required" });

  if (typeof name !== "string" || typeof unit !== "number" || typeof amount !== "number") {
    return res.status(400).json({ error: "Invalid data types" });
  }

  const { data, error } = await supabase.from("disbursements").insert([{ name, unit, amount }]);
  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json("Disbursement created successfully");

});

// DELETE disbursement by ID
router.delete("/", async (req, res) => {
  const { id } = req.body;
  const { data, error } = await supabase.from("disbursements").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Disbursement deleted"});
});

export default router;