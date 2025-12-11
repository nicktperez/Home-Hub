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
  if (!apiKey && !accessToken) {
    return res.status(500).json({ 
      error: "Missing Enphase credentials",
      message: "You need either ENPHASE_API_KEY or ENPHASE_ACCESS_TOKEN. If you have Client ID/Secret, visit /api/enphase-oauth to get an access token."
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
        
        // Enphase API v4 uses API key as query parameter 'key='
        let urlParams = [];
        const headers = {
          "Accept": "application/json",
        };
        
        if (accessToken) {
          // Use OAuth access token in header
          headers["Authorization"] = `Bearer ${accessToken}`;
          if (summary_date) {
            urlParams.push(`summary_date=${summary_date}`);
          } else if (start_date && end_date) {
            urlParams.push(`start_date=${start_date}`, `end_date=${end_date}`);
          } else {
            urlParams.push(`summary_date=${today}`);
          }
        } else if (apiKey) {
          // API key MUST be first query parameter
          urlParams.push(`key=${apiKey}`);
          if (summary_date) {
            urlParams.push(`summary_date=${summary_date}`);
          } else if (start_date && end_date) {
            urlParams.push(`start_date=${start_date}`, `end_date=${end_date}`);
          } else {
            urlParams.push(`summary_date=${today}`);
          }
        } else {
          return res.status(400).json({
            error: "Authentication required",
            message: "You need either ENPHASE_ACCESS_TOKEN (OAuth) or ENPHASE_API_KEY. See DEPLOY.md for setup instructions."
          });
        }
        
        // Enphase API v4 endpoint format
        const url = `${baseUrl}/systems/${systemId}/production?${urlParams.join('&')}`;
        
        console.log("Enphase API request URL (redacted):", url.replace(/key=[^&]+/, 'key=***'));
        
        const response = await fetch(url, {
          method: "GET",
          headers: headers,
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
              : response.status === 405
              ? "Method not allowed. The API endpoint or authentication method may be incorrect. Check: 1) Your API key format, 2) System ID is correct, 3) API access is enabled in Enphase account."
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

