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

  try {
    if (method === "GET") {
      // GET /api/projects - order by order field first, then updatedat
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("order", { ascending: true, nullsFirst: false })
        .order("updatedat", { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (method === "POST") {
      // POST /api/projects
      const body = req.body || {};
      const { title, note, progress, startDate, endDate } = body;
      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      const now = new Date().toISOString();
      const cleanProgress = typeof progress === "number" && progress >= 0 && progress <= 100 ? progress : 0;

      // Get current max order to place new project at the end
      const { data: existingProjects } = await supabase
        .from("projects")
        .select("order")
        .order("order", { ascending: false })
        .limit(1);
      
      const maxOrder = existingProjects && existingProjects.length > 0 && existingProjects[0].order !== null
        ? existingProjects[0].order + 1
        : 0;

      // Use lowercase column names to match PostgreSQL (unquoted columns are lowercased)
      const { data, error } = await supabase
        .from("projects")
        .insert({
          id: Date.now().toString(),
          title: title.trim(),
          done: false,
          status: "todo",
          updatedat: now, // Use lowercase to match database column
          note: typeof note === "string" ? note.trim() : "",
          progress: cleanProgress,
          startdate: typeof startDate === "string" ? startDate : "",
          enddate: typeof endDate === "string" ? endDate : "",
          updates: [],
          order: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // PATCH and DELETE are handled by /api/projects/[id].js
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed. Use /api/projects/:id for PATCH/DELETE" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

