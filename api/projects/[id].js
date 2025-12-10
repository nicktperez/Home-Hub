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
  
  // Extract ID from query (Vercel dynamic routes use req.query)
  // Also check URL path as fallback
  let id = req.query?.id;
  
  // If not in query, try to extract from URL path
  if (!id && req.url) {
    const urlMatch = req.url.match(/\/api\/projects\/([^/?]+)/);
    if (urlMatch) {
      id = decodeURIComponent(urlMatch[1]);
    }
  }
  
  // Log for debugging
  console.log("Delete request:", { 
    method, 
    query: req.query, 
    url: req.url, 
    extractedId: id 
  });

  if (!id) {
    console.error("No ID found in request:", { 
      query: req.query, 
      url: req.url,
      headers: req.headers 
    });
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
      // Only update the fields that are being changed, use lowercase column names
      const updated = {
        updatedat: now, // Use lowercase to match database column
      };

      if (typeof updates.title === "string") {
        updated.title = updates.title.trim();
      }
      if (typeof updates.status === "string") {
        updated.status = updates.status;
        updated.done = updates.status === "done";
      }
      if (typeof updates.done === "boolean") {
        updated.done = updates.done;
        if (!updates.status) {
          updated.status = updated.done ? "done" : current.status === "done" ? "todo" : current.status || "todo";
        }
      }
      if (typeof updates.note === "string") {
        updated.note = updates.note.trim();
      }
      if (typeof updates.progress === "number") {
        const p = Math.min(100, Math.max(0, updates.progress));
        updated.progress = p;
      }
      if (typeof updates.startDate === "string") {
        updated.startdate = updates.startDate;
      }
      if (typeof updates.endDate === "string") {
        updated.enddate = updates.endDate;
      }
      if (Array.isArray(updates.updates)) {
        updated.updates = updates.updates;
      }
      if (updates.appendUpdate && typeof updates.appendUpdate === "string") {
        updated.updates = current.updates || [];
        updated.updates.push({ message: updates.appendUpdate.trim(), at: now });
      }

      const { data, error } = await supabase.from("projects").update(updated).eq("id", id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === "DELETE") {
      // DELETE /api/projects/:id
      const { data, error } = await supabase.from("projects").delete().eq("id", id).select();
      if (error) {
        console.error("Supabase delete error:", error);
        throw error;
      }
      // Check if any rows were deleted
      if (!data || data.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

