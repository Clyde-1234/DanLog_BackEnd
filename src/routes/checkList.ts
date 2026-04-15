import express from "express";
import { supabase } from "../supabaseClient";

const router = express.Router();

// get all check list items
// GET /check-list
router.get("/", async (req, res) => {
    const { data, error } = await supabase.from("check_list").select("*");

    if (error) return res.status(500).json({ error: error.message });
    
    res.json(data);
});


//post a new check list item
// POST /checkList
router.post("/", async (req, res) => {
    const { task, is_done } = req.body;

    if (!task || typeof is_done !== "boolean") {
        return res.status(400).json({ error: "Invalid input" });
    }

    const { data, error } = await supabase.from("check_list").insert([{ task, is_done }]);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Task created" });
});


// update a check list item
// PATCH /check-list
router.patch("/", async (req, res) => {
    const { id, is_done } = req.body;

    if (!id || typeof is_done !== "boolean") {
        return res.status(400).json({ error: "Invalid input" });
    }

    const { data, error } = await supabase.from("check_list").update({ is_done }).eq("id", id);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Task updated" });
});


// delete a check list item
// DELETE /check-list/:id
router.delete("/", async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Invalid input" });
    }

    const { data, error } = await supabase.from("check_list").delete().eq("id", id);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Task deleted" });
});

export default router;
