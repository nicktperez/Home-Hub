// Handle /api/notes/:id routes (PATCH and DELETE)
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
    return res.status(400).json({ error: "Note ID is required" });
  }

  try {
    if (method === "PATCH") {
      const updates = req.body || {};
      const { data: current, error: fetchError } = await supabase.from("notes").select("*").eq("id", id).single();
      if (fetchError || !current) {
        return res.status(404).json({ error: "Note not found" });
      }

      const now = new Date().toISOString();
      // Only update the fields that are being changed, use lowercase column names
      const updated = {
        updatedat: now, // Use lowercase to match database column
      };

      if (typeof updates.content === "string") {
        updated.content = updates.content.trim();
      }
      if (typeof updates.color === "string") {
        updated.color = updates.color;
      }
      if (typeof updates.done === "boolean") {
        updated.done = updates.done;
      }
      if (typeof updates.notedate === "string") {
        updated.notedate = updates.notedate;
      }

      const { data, error } = await supabase.from("notes").update(updated).eq("id", id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === "DELETE") {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Notes API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

