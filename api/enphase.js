// Enphase Enlighten API integration
// Fetches solar production data from Enphase systems

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = process.env.ENPHASE_API_KEY;
  const systemId = process.env.ENPHASE_SYSTEM_ID;
  const userId = process.env.ENPHASE_USER_ID; // Optional, for some endpoints

  if (!apiKey) {
    return res.status(500).json({ error: "Missing Enphase API key configuration" });
  }

  if (req.method === "GET") {
    try {
      // Get query parameters
      const { start_date, end_date, summary_date } = req.query || {};

      // If system ID is provided, fetch data for that system
      if (systemId) {
        // Fetch production data for the system
        // Enphase API v4 endpoint: /systems/{system_id}/production
        const baseUrl = "https://api.enphaseenergy.com/api/v4";
        
        let url;
        if (summary_date) {
          // Get summary for a specific date
          url = `${baseUrl}/systems/${systemId}/production?key=${apiKey}&summary_date=${summary_date}`;
        } else if (start_date && end_date) {
          // Get data for a date range
          url = `${baseUrl}/systems/${systemId}/production?key=${apiKey}&start_date=${start_date}&end_date=${end_date}`;
        } else {
          // Get today's production
          const today = new Date().toISOString().split("T")[0];
          url = `${baseUrl}/systems/${systemId}/production?key=${apiKey}&summary_date=${today}`;
        }

        const response = await fetch(url, {
          headers: {
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Enphase API error:", response.status, errorText);
          return res.status(response.status).json({
            error: `Enphase API error: ${response.status}`,
            details: errorText,
          });
        }

        const data = await response.json();
        return res.status(200).json(data);
      } else {
        // If no system ID, try to get systems list (requires user_id or different auth)
        // For now, return instructions
        return res.status(400).json({
          error: "System ID required",
          message: "Please provide ENPHASE_SYSTEM_ID in environment variables. You can find your system ID in your Enphase account.",
        });
      }
    } catch (error) {
      console.error("Enphase API error:", error);
      return res.status(500).json({
        error: error.message || "Failed to fetch Enphase data",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  if (req.method === "POST") {
    // POST endpoint to sync/import Enphase data
    try {
      const { start_date, end_date } = req.body || {};
      
      if (!systemId) {
        return res.status(400).json({ error: "System ID required" });
      }

      // Fetch production data
      const baseUrl = "https://api.enphaseenergy.com/api/v4";
      const start = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // Default: last 30 days
      const end = end_date || new Date().toISOString().split("T")[0];

      const url = `${baseUrl}/systems/${systemId}/production?key=${apiKey}&start_date=${start}&end_date=${end}`;
      
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Enphase API error: ${response.status}`,
          details: errorText,
        });
      }

      const data = await response.json();
      
      // Process and return the data
      // Enphase returns data in a specific format - we'll need to parse it
      return res.status(200).json({
        message: "Enphase data fetched successfully",
        data: data,
        period: { start, end },
      });
    } catch (error) {
      console.error("Enphase sync error:", error);
      return res.status(500).json({
        error: error.message || "Failed to sync Enphase data",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};

