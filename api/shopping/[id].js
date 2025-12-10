// Handle /api/shopping/:id routes (PATCH and DELETE)
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Missing Supabase configuration" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Item ID is required" });
  }

  try {
    if (method === "PATCH") {
      const updates = req.body || {};
      const { data: current, error: fetchError } = await supabase.from("shopping").select("*").eq("id", id).single();
      if (fetchError || !current) {
        return res.status(404).json({ error: "Item not found" });
      }

      const now = new Date().toISOString();
      // Update with updatedAt if column exists
      const updated = {
        updatedAt: now,
      };

      if (typeof updates.item === "string") {
        updated.item = updates.item.trim();
      }
      if (typeof updates.checked === "boolean") {
        updated.checked = updates.checked;
      }

      const { data, error } = await supabase.from("shopping").update(updated).eq("id", id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === "DELETE") {
      const { error } = await supabase.from("shopping").delete().eq("id", id);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Shopping API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

