// Handle /api/projects/:id routes (PATCH and DELETE)
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  // Enable CORS
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
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    if (method === "PATCH") {
      // PATCH /api/projects/:id
      const updates = req.body || {};

      // Fetch current project
      const { data: current, error: fetchError } = await supabase.from("projects").select("*").eq("id", id).single();
      if (fetchError || !current) {
        return res.status(404).json({ error: "Project not found" });
      }

      const now = new Date().toISOString();
      const updated = { ...current };

      if (typeof updates.title === "string") {
        updated.title = updates.title.trim();
        updated.updatedAt = now;
      }
      if (typeof updates.status === "string") {
        updated.status = updates.status;
        updated.done = updates.status === "done";
        updated.updatedAt = now;
      }
      if (typeof updates.done === "boolean") {
        updated.done = updates.done;
        if (!updates.status) {
          updated.status = updated.done ? "done" : updated.status === "done" ? "todo" : updated.status || "todo";
        }
        updated.updatedAt = now;
      }
      if (typeof updates.note === "string") {
        updated.note = updates.note.trim();
        updated.updatedAt = now;
      }
      if (typeof updates.progress === "number") {
        const p = Math.min(100, Math.max(0, updates.progress));
        updated.progress = p;
        updated.updatedAt = now;
      }
      if (typeof updates.startDate === "string") {
        updated.startDate = updates.startDate;
        updated.updatedAt = now;
      }
      if (typeof updates.endDate === "string") {
        updated.endDate = updates.endDate;
        updated.updatedAt = now;
      }
      if (Array.isArray(updates.updates)) {
        updated.updates = updates.updates;
        updated.updatedAt = now;
      }
      if (updates.appendUpdate && typeof updates.appendUpdate === "string") {
        updated.updates = updated.updates || [];
        updated.updates.push({ message: updates.appendUpdate.trim(), at: now });
        updated.updatedAt = now;
      }

      const { data, error } = await supabase.from("projects").update(updated).eq("id", id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === "DELETE") {
      // DELETE /api/projects/:id
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

