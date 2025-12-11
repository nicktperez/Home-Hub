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
        // Try different base URLs - Enphase might use different API versions
        const baseUrls = [
          "https://api.enphaseenergy.com/api/v4",
          "https://api.enphaseenergy.com/api/v2",
        ];
        const baseUrl = baseUrls[0]; // Start with v4
        // Get today's date in YYYY-MM-DD format (UTC)
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        
        // Enphase API often considers "today" as "in the future" if data isn't available yet
        // Use yesterday's date as default to ensure we get data
        const yesterday = new Date(now);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        
        console.log(`Date handling: today=${today}, yesterday=${yesterdayStr}`);
        
        // Enphase API v4 uses API key as query parameter 'key='
        // IMPORTANT: API key seems more reliable than OAuth token for /production endpoint
        // Use API key if available, otherwise try OAuth token
        let urlParams = [];
        const headers = {
          "Accept": "application/json",
        };
        
        // CRITICAL: Enphase API v4 requires BOTH:
        // 1. OAuth 2.0 access token in Authorization: Bearer header
        // 2. API key in a header named 'key' (NOT in query params!)
        // See: https://developer-v4.enphase.com/docs.html
        
        if (!apiKey || !accessToken) {
          return res.status(400).json({
            error: "Both credentials required",
            message: "Enphase API v4 requires BOTH ENPHASE_API_KEY (in 'key' header) AND ENPHASE_ACCESS_TOKEN (in Authorization header). See DEPLOY.md for setup instructions."
          });
        }
        
        // Set both headers as required by Enphase API v4
        headers["Authorization"] = `Bearer ${accessToken}`;
        headers["key"] = apiKey; // API key goes in header, NOT query parameter!
        
        // Add date params
        // Default to yesterday since "today" is often considered "in the future" by the API
        if (summary_date) {
          urlParams.push(`summary_date=${summary_date}`);
        } else if (start_date && end_date) {
          urlParams.push(`start_date=${start_date}`, `end_date=${end_date}`);
        } else {
          // Use yesterday by default to avoid "date in future" errors
          urlParams.push(`summary_date=${yesterdayStr}`);
        }
        
        console.log("Using BOTH OAuth token (Bearer) and API key (header) as required by Enphase API v4");
        
        // Enphase API endpoint format
        // Try multiple API versions and endpoints
        let url;
        let response;
        let responseText = "";
        let lastError = null;
        
        // Try different endpoint combinations
        // All attempts will use BOTH OAuth token and API key in headers (as required by Enphase API v4)
        const attempts = [
          { base: "https://api.enphaseenergy.com/api/v4", path: `systems/${systemId}/summary`, name: "v4/summary" },
          { base: "https://api.enphaseenergy.com/api/v4", path: `systems/${systemId}/rgm_stats`, name: "v4/rgm_stats" },
          { base: "https://api.enphaseenergy.com/api/v4", path: `systems/${systemId}/stats`, name: "v4/stats" },
          { base: "https://api.enphaseenergy.com/api/v4", path: `systems/${systemId}/production`, name: "v4/production" },
        ];
        
        for (const attempt of attempts) {
          // Build URL - headers already set with both OAuth token and API key
          // Note: Some endpoints might not need date params (like rgm_stats)
          let attemptParams = [...urlParams];
          if (attempt.path.includes('rgm_stats')) {
            // rgm_stats might need different params, try without date first
            attemptParams = attemptParams.filter(p => !p.includes('summary_date') && !p.includes('start_date') && !p.includes('end_date'));
          } else if (attempt.path.includes('summary')) {
            // For summary endpoint, use yesterday if today is considered "in the future"
            attemptParams = attemptParams.map(p => {
              if (p.startsWith('summary_date=')) {
                const dateValue = p.split('=')[1];
                // If the date is today or in the future, use yesterday instead
                if (dateValue >= today) {
                  return `summary_date=${yesterdayStr}`;
                }
              }
              return p;
            });
          }
          
          const queryString = attemptParams.length > 0 ? `?${attemptParams.join('&')}` : '';
          url = `${attempt.base}/${attempt.path}${queryString}`;
          console.log(`Trying ${attempt.name} endpoint:`, url.substring(0, 120) + "...");
          console.log(`  Headers: Authorization (Bearer token) + key (API key)`);
          
          response = await fetch(url, {
            method: "GET",
            headers: headers, // Both OAuth token and API key are in headers
          });
          
          responseText = await response.text();
          
          if (response.ok) {
            console.log(`✅ Success with ${attempt.name} endpoint!`);
            break;
          }
          
          lastError = { status: response.status, text: responseText, endpoint: attempt.name };
          
          // Continue trying if 401 or 405 (auth/endpoint issues)
          if (response.status !== 401 && response.status !== 405) {
            console.log(`${attempt.name} returned ${response.status}, stopping endpoint search`);
            break;
          }
          
          console.log(`${attempt.name} returned ${response.status}, trying next endpoint...`);
        }
        
        // Check if we got a successful response
        if (!response || !response.ok) {
          const errorText = response ? responseText : JSON.stringify(lastError || { error: "No response" });
          console.error("Enphase API error:", response?.status || "No response", errorText);
          let errorDetails;
          try {
            errorDetails = JSON.parse(errorText);
          } catch {
            errorDetails = errorText;
          }
          
          // If 401, check if access token is missing or try alternative authentication
          if (response?.status === 401 && accessToken) {
            console.log("401 error - trying alternative authentication methods...");
            
            // Try 1: Token without "Bearer" prefix
            console.log("Trying token without Bearer prefix...");
            const altHeaders1 = {
              "Accept": "application/json",
              "Authorization": accessToken, // No "Bearer" prefix
            };
            const altResponse1 = await fetch(url, {
              method: "GET",
              headers: altHeaders1,
            });
            
            if (altResponse1.ok) {
              const altData = await altResponse1.json();
              return res.status(200).json(altData);
            }
            
            // Try 2: Token in query parameter
            console.log("Trying token in query parameter...");
            const altUrl = `${baseUrl}/systems/${systemId}/summary?access_token=${accessToken}${urlParams.length > 0 ? '&' + urlParams.join('&') : ''}`;
            const altResponse2 = await fetch(altUrl, {
              method: "GET",
              headers: {
                "Accept": "application/json",
              },
            });
            
            if (altResponse2.ok) {
              const altData = await altResponse2.json();
              return res.status(200).json(altData);
            }
            
            // Try 3: Different endpoint - /production instead of /summary
            console.log("Trying /production endpoint instead...");
            const prodUrl = `${baseUrl}/systems/${systemId}/production?${urlParams.join('&')}`;
            const altResponse3 = await fetch(prodUrl, {
              method: "GET",
              headers: headers,
            });
            
            if (altResponse3.ok) {
              const altData = await altResponse3.json();
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
          
          return res.status(response?.status || 500).json({
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

        // Parse successful response
        if (response && response.ok) {
          const successText = await response.text();
          let data;
          try {
            data = JSON.parse(successText);
          } catch (e) {
            return res.status(500).json({
              error: "Invalid JSON response from Enphase API",
              details: successText.substring(0, 200)
            });
          }
          
          console.log("Enphase API success, data keys:", Object.keys(data));
          return res.status(200).json(data);
        }
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

