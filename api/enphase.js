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

  // Debug logging
  console.log("Enphase API - Environment check:");
  console.log("- API Key present:", !!apiKey);
  console.log("- Access Token present:", !!accessToken, accessToken ? "(length: " + accessToken.length + ")" : "");
  console.log("- System ID present:", !!systemId, systemId ? "(value: " + systemId + ")" : "");

  // Check what credentials we have
  if (!apiKey && !accessToken) {
    return res.status(500).json({ 
      error: "Missing Enphase credentials",
      message: "You need either ENPHASE_API_KEY or ENPHASE_ACCESS_TOKEN. If you have Client ID/Secret, visit /api/enphase-oauth to get an access token."
    });
  }
  
  if (!systemId) {
    return res.status(500).json({
      error: "Missing System ID",
      message: "Please set ENPHASE_SYSTEM_ID in environment variables."
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
          // Enphase requires the token in Authorization header
          headers["Authorization"] = `Bearer ${accessToken}`;
          // Also try as a query parameter (some Enphase endpoints might need this)
          if (summary_date) {
            urlParams.push(`summary_date=${summary_date}`);
          } else if (start_date && end_date) {
            urlParams.push(`start_date=${start_date}`, `end_date=${end_date}`);
          } else {
            urlParams.push(`summary_date=${today}`);
          }
          
          console.log("Access token present:", accessToken ? "Yes (length: " + accessToken.length + ")" : "No");
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
        // Try different endpoint formats based on authentication method
        let url;
        if (accessToken) {
          // With OAuth token, use /systems/{system_id}/summary endpoint
          url = `${baseUrl}/systems/${systemId}/summary?${urlParams.join('&')}`;
        } else {
          // With API key, use /production endpoint
          url = `${baseUrl}/systems/${systemId}/production?${urlParams.join('&')}`;
        }
        
        console.log("Enphase API request URL (redacted):", url.replace(/key=[^&]+/, 'key=***'));
        console.log("Using access token:", accessToken ? "Yes (length: " + accessToken.length + ")" : "No");
        console.log("System ID:", systemId);
        console.log("Request headers:", Object.keys(headers));
        console.log("Authorization header:", headers["Authorization"] ? "Present" : "Missing");
        
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
          
          // If 401, check if access token is missing or try alternative authentication
          if (response.status === 401 && accessToken) {
            console.log("401 error - checking token format...");
            // Try with token in query parameter as well (some APIs need both)
            const altUrl = `${baseUrl}/systems/${systemId}/summary?access_token=${accessToken}${urlParams.length > 0 ? '&' + urlParams.join('&') : ''}`;
            console.log("Trying alternative URL with token in query param...");
            const altResponse = await fetch(altUrl, {
              method: "GET",
              headers: {
                "Accept": "application/json",
              },
            });
            
            if (altResponse.ok) {
              const altData = await altResponse.json();
              return res.status(200).json(altData);
            }
          }
          
          // If 405 with access token, try the /production endpoint instead
          if (response.status === 405 && accessToken) {
            console.log("405 error with access token, trying /production endpoint...");
            const altUrl = `${baseUrl}/systems/${systemId}/production?${urlParams.join('&')}`;
            const altResponse = await fetch(altUrl, {
              method: "GET",
              headers: headers,
            });
            
            if (altResponse.ok) {
              const altData = await altResponse.json();
              return res.status(200).json(altData);
            }
            
            // If still fails, try without query params
            console.log("Still failing, trying without query params...");
            const simpleUrl = `${baseUrl}/systems/${systemId}/summary`;
            const simpleResponse = await fetch(simpleUrl, {
              method: "GET",
              headers: headers,
            });
            
            if (simpleResponse.ok) {
              const simpleData = await simpleResponse.json();
              return res.status(200).json(simpleData);
            }
          }
          
          return res.status(response.status).json({
            error: `Enphase API error: ${response.status}`,
            details: errorDetails,
            message: response.status === 401 
              ? "Authentication failed. Check: 1) Access token is correct, 2) Token hasn't expired, 3) API access is enabled in Enphase account."
              : response.status === 404
              ? "System not found. Check your ENPHASE_SYSTEM_ID."
              : response.status === 405
              ? "Method not allowed. Trying alternative endpoints. Check: 1) System ID is correct, 2) Access token is valid, 3) API access is enabled."
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

