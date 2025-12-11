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
  const clientId = process.env.ENPHASE_CLIENT_ID;
  const clientSecret = process.env.ENPHASE_CLIENT_SECRET;
  const systemId = process.env.ENPHASE_SYSTEM_ID;
  const accessToken = process.env.ENPHASE_ACCESS_TOKEN; // For OAuth flow

  // Check what credentials we have
  if (!apiKey && !clientId) {
    return res.status(500).json({ 
      error: "Missing Enphase credentials",
      message: "You need either ENPHASE_API_KEY (for older API) or ENPHASE_CLIENT_ID + ENPHASE_CLIENT_SECRET (for OAuth v4 API)"
    });
  }

  if (req.method === "GET") {
    try {
      // Get query parameters
      const { start_date, end_date, summary_date } = req.query || {};

      // If system ID is provided, fetch data for that system
      if (systemId) {
        const baseUrl = "https://api.enphaseenergy.com/api/v4";
        const today = new Date().toISOString().split("T")[0];
        
        // Try OAuth first (if access token is available)
        let authHeader = "";
        let urlParams = "";
        
        if (accessToken) {
          // Use OAuth access token
          authHeader = `Bearer ${accessToken}`;
          urlParams = summary_date 
            ? `summary_date=${summary_date}` 
            : start_date && end_date
            ? `start_date=${start_date}&end_date=${end_date}`
            : `summary_date=${today}`;
        } else if (apiKey) {
          // Try direct API key (older method, may not work with v4)
          urlParams = summary_date 
            ? `key=${apiKey}&summary_date=${summary_date}` 
            : start_date && end_date
            ? `key=${apiKey}&start_date=${start_date}&end_date=${end_date}`
            : `key=${apiKey}&summary_date=${today}`;
        } else {
          return res.status(400).json({
            error: "Authentication required",
            message: "You need either ENPHASE_ACCESS_TOKEN (OAuth) or ENPHASE_API_KEY. See DEPLOY.md for setup instructions."
          });
        }
        
        const url = `${baseUrl}/systems/${systemId}/production?${urlParams}`;
        
        console.log("Enphase API request:", url.substring(0, 100) + "...");
        
        const response = await fetch(url, {
          headers: {
            "Accept": "application/json",
            ...(authHeader && { "Authorization": authHeader }),
          },
        });

        const responseText = await response.text();
        
        if (!response.ok) {
          console.error("Enphase API error:", response.status, responseText);
          let errorDetails;
          try {
            errorDetails = JSON.parse(responseText);
          } catch {
            errorDetails = responseText;
          }
          
          return res.status(response.status).json({
            error: `Enphase API error: ${response.status}`,
            details: errorDetails,
            message: response.status === 401 
              ? "Authentication failed. You may need to: 1) Enable API access in your Enphase account settings, 2) Grant access to your application, 3) Use OAuth flow to get an access token."
              : response.status === 404
              ? "System not found. Check your ENPHASE_SYSTEM_ID."
              : "See details for more information"
          });
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          return res.status(500).json({
            error: "Invalid JSON response from Enphase API",
            details: responseText.substring(0, 200)
          });
        }
        
        console.log("Enphase API success, data keys:", Object.keys(data));
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

