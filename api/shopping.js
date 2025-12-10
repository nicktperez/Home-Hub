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
  const { id } = req.query || {};

  try {
    if (method === "GET" && !id) {
      // GET /api/shopping - order by created_at (timestamp column)
      const { data, error } = await supabase.from("shopping").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (method === "POST" && !id) {
      // POST /api/shopping
      const body = req.body || {};
      const { item } = body;
      if (!item || typeof item !== "string" || !item.trim()) {
        return res.status(400).json({ error: "Item is required" });
      }

      const now = new Date().toISOString();
      // Insert with updatedat (lowercase) to match database column name
      // PostgreSQL stores unquoted identifiers as lowercase
      const { data, error } = await supabase
        .from("shopping")
        .insert({
          id: Date.now().toString(),
          item: item.trim(),
          checked: false,
          updatedat: now, // Use lowercase to match database column
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (method === "PATCH" && id) {
      // PATCH /api/shopping/:id
      const updates = req.body || {};
      const { data: current, error: fetchError } = await supabase.from("shopping").select("*").eq("id", id).single();
      if (fetchError || !current) {
        return res.status(404).json({ error: "Item not found" });
      }

      const now = new Date().toISOString();
      // Update with updatedat (lowercase) to match database column name
      const updated = {
        updatedat: now, // Use lowercase to match database column
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

    if (method === "DELETE" && id) {
      // DELETE /api/shopping/:id
      const { error } = await supabase.from("shopping").delete().eq("id", id);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(404).json({ error: "Not found" });
  } catch (error) {
    console.error("Shopping API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

