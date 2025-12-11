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
      
      if (error) {
        console.error("Error fetching energy data:", error);
        return res.status(500).json({ error: error.message });
      }
      
      console.log(`Fetched ${data?.length || 0} energy records`);
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

      // Find the header row (skip metadata lines)
      let headerLineIndex = -1;
      let headers = [];
      for (let i = 0; i < lines.length; i++) {
        const parsed = parseCSVLine(lines[i]);
        const headerCheck = parsed.map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
        // Look for SMUD header pattern: TYPE, START DATE, END DATE, IMPORT, etc.
        if (headerCheck.includes("type") && (headerCheck.includes("start date") || headerCheck.includes("end date"))) {
          headerLineIndex = i;
          headers = headerCheck;
          break;
        }
      }

      if (headerLineIndex === -1) {
        return res.status(400).json({ 
          error: "Could not find header row in CSV. Expected columns: TYPE, START DATE, END DATE, IMPORT (kWh), COST" 
        });
      }

      const records = [];

      // Find columns - SMUD specific format
      const typeIndex = headers.findIndex(h => h === "type");
      const startDateIndex = headers.findIndex(h => h.includes("start date"));
      const endDateIndex = headers.findIndex(h => h.includes("end date"));
      const importIndex = headers.findIndex(h => h.includes("import") && h.includes("kwh"));
      const exportIndex = headers.findIndex(h => h.includes("export") && h.includes("kwh"));
      const costIndex = headers.findIndex(h => h === "cost");

      if (endDateIndex === -1 || importIndex === -1) {
        return res.status(400).json({ 
          error: `Could not find required columns. Found: ${headers.join(", ")}` 
        });
      }

      // Parse each data row (start after header)
      for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, "").trim());
        if (values.length < Math.max(endDateIndex, importIndex) + 1) continue;

        // Skip non-billing rows (only process "Electric billing" type)
        if (typeIndex !== -1 && values[typeIndex] && !values[typeIndex].toLowerCase().includes("billing")) {
          continue;
        }

        // Use END DATE as the date for the record (billing period end date)
        const dateStr = values[endDateIndex];
        const importStr = values[importIndex];
        const exportStr = exportIndex !== -1 ? values[exportIndex] : null;
        const costStr = costIndex !== -1 ? values[costIndex] : null;

        // Parse date (SMUD uses YYYY-MM-DD format)
        let date;
        try {
          // SMUD format is YYYY-MM-DD, which Date.parse handles well
          date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            // Try parsing as YYYY-MM-DD explicitly
            const parts = dateStr.split(/[\/\-]/);
            if (parts.length === 3) {
              // Assume YYYY-MM-DD format
              date = new Date(parts[0], parts[1] - 1, parts[2]);
            }
          }
        } catch {
          continue; // Skip invalid dates
        }

        if (isNaN(date.getTime())) continue;

        // Parse import usage (kWh) - remove any non-numeric characters except decimal point
        const importUsage = parseFloat(importStr.replace(/[^\d.-]/g, "")) || 0;
        
        // Parse export usage (kWh) if available (solar export)
        const exportUsage = exportStr ? parseFloat(exportStr.replace(/[^\d.-]/g, "")) || 0 : 0;
        
        // Net usage = import - export (if export exists)
        const netUsage = importUsage - exportUsage;
        
        // Parse cost - SMUD format has dollar signs like "$83.83"
        const cost = costStr ? parseFloat(costStr.replace(/[^\d.-]/g, "")) || null : null;

        records.push({
          date: date.toISOString().split("T")[0], // YYYY-MM-DD format
          usage_kwh: netUsage > 0 ? netUsage : importUsage, // Use net usage if positive, otherwise just import
          cost: cost,
        });
      }

      if (records.length === 0) {
        return res.status(400).json({ error: "No valid records found in CSV" });
      }

      // Insert records into database (upsert by date to avoid duplicates)
      console.log(`Attempting to insert ${records.length} records`);
      console.log("Sample record:", records[0]);
      
      const insertResults = await Promise.all(
        records.map(record => 
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
        )
      );

      // Check for errors
      const errors = insertResults.filter(r => r.error);
      if (errors.length > 0) {
        console.error("Some records failed to insert:", errors);
        const firstError = errors[0].error;
        return res.status(500).json({ 
          error: `Failed to insert records: ${firstError.message}. Make sure the energy_usage table exists in Supabase.`,
          count: records.length - errors.length,
          details: firstError
        });
      }

      console.log(`Successfully inserted ${records.length} records`);
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

