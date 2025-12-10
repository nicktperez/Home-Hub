const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).json({});
  }

  const method = req.method;

  try {
    if (method === "GET") {
      // GET /api/energy - Get all energy usage records
      const { data, error } = await supabase
        .from("energy_usage")
        .select("*")
        .order("date", { ascending: false })
        .limit(365); // Last year of data
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (method === "POST") {
      // POST /api/energy - Upload and parse CSV data
      const { csvData } = req.body;
      
      if (!csvData || typeof csvData !== "string") {
        return res.status(400).json({ error: "CSV data is required" });
      }

      // Parse CSV data (handle quoted values)
      const parseCSVLine = (line) => {
        const result = [];
        let current = "";
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const lines = csvData.split("\n").filter(line => line.trim());
      if (lines.length < 2) {
        return res.status(400).json({ error: "Invalid CSV format" });
      }

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
      const records = [];

      // Find date and usage columns (SMUD CSV format may vary)
      const dateIndex = headers.findIndex(h => 
        h.includes("date") || h.includes("period") || h.includes("billing") || h.includes("day")
      );
      const usageIndex = headers.findIndex(h => 
        h.includes("usage") || h.includes("kwh") || h.includes("consumption") || h.includes("energy")
      );
      const costIndex = headers.findIndex(h => 
        h.includes("cost") || h.includes("amount") || h.includes("charge") || h.includes("total")
      );

      if (dateIndex === -1 || usageIndex === -1) {
        return res.status(400).json({ 
          error: `Could not find date or usage columns in CSV. Found columns: ${headers.join(", ")}` 
        });
      }

      // Parse each data row
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, "").trim());
        if (values.length < Math.max(dateIndex, usageIndex) + 1) continue;

        const dateStr = values[dateIndex];
        const usageStr = values[usageIndex];
        const costStr = costIndex !== -1 ? values[costIndex] : null;

        // Parse date (handle various formats)
        let date;
        try {
          date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            // Try parsing as MM/DD/YYYY or other formats
            const parts = dateStr.split(/[\/\-]/);
            if (parts.length === 3) {
              date = new Date(parts[2], parts[0] - 1, parts[1]);
            }
          }
        } catch {
          continue; // Skip invalid dates
        }

        if (isNaN(date.getTime())) continue;

        // Parse usage (remove any non-numeric characters except decimal point)
        const usage = parseFloat(usageStr.replace(/[^\d.-]/g, "")) || 0;
        const cost = costStr ? parseFloat(costStr.replace(/[^\d.-]/g, "")) || 0 : null;

        records.push({
          date: date.toISOString().split("T")[0], // YYYY-MM-DD format
          usage_kwh: usage,
          cost: cost,
        });
      }

      if (records.length === 0) {
        return res.status(400).json({ error: "No valid records found in CSV" });
      }

      // Insert records into database (upsert by date to avoid duplicates)
      const insertPromises = records.map(record => 
        supabase
          .from("energy_usage")
          .upsert({
            date: record.date,
            usage_kwh: record.usage_kwh,
            cost: record.cost,
            updatedat: new Date().toISOString(),
          }, {
            onConflict: "date"
          })
      );

      await Promise.all(insertPromises);

      return res.status(201).json({ 
        message: `Successfully imported ${records.length} records`,
        count: records.length 
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Energy API error:", error);
    return res.status(500).json({ 
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

