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
        const today = new Date().toISOString().split("T")[0];
        
        // Enphase API v4 uses API key as query parameter 'key='
        // IMPORTANT: API key seems more reliable than OAuth token for /production endpoint
        // Use API key if available, otherwise try OAuth token
        let urlParams = [];
        const headers = {
          "Accept": "application/json",
        };
        
        // Try both authentication methods - some endpoints require OAuth token
        // Use API key for /production, OAuth token for /summary endpoints
        let useApiKey = false;
        let useOAuthToken = false;
        
        if (apiKey) {
          // API key for /production endpoint
          useApiKey = true;
          urlParams.push(`key=${apiKey}`);
          if (summary_date) {
            urlParams.push(`summary_date=${summary_date}`);
          } else if (start_date && end_date) {
            urlParams.push(`start_date=${start_date}`, `end_date=${end_date}`);
          } else {
            urlParams.push(`summary_date=${today}`);
          }
        }
        
        if (accessToken) {
          // OAuth token for /summary and other endpoints
          useOAuthToken = true;
          headers["Authorization"] = `Bearer ${accessToken}`;
          // Don't add date params if we already have them from API key
          if (!useApiKey) {
            if (summary_date) {
              urlParams.push(`summary_date=${summary_date}`);
            } else if (start_date && end_date) {
              urlParams.push(`start_date=${start_date}`, `end_date=${end_date}`);
            } else {
              urlParams.push(`summary_date=${today}`);
            }
          }
        }
        
        if (!useApiKey && !useOAuthToken) {
          return res.status(400).json({
            error: "Authentication required",
            message: "You need either ENPHASE_ACCESS_TOKEN (OAuth) or ENPHASE_API_KEY. See DEPLOY.md for setup instructions."
          });
        }
        
        console.log("Auth methods:", { apiKey: useApiKey, oauthToken: useOAuthToken });
        
        // Enphase API endpoint format
        // Try multiple API versions and endpoints
        let url;
        let response;
        let responseText = "";
        let lastError = null;
        
        // Try different endpoint combinations with appropriate auth
        // /production works with API key, /summary works with OAuth token
        const attempts = [];
        
        // Try API key with /production endpoints first
        if (useApiKey) {
          attempts.push(
            { base: "https://api.enphaseenergy.com/api/v4", path: "production", name: "v4/production", useApiKey: true },
            { base: "https://api.enphaseenergy.com/api/v2", path: "production", name: "v2/production", useApiKey: true }
          );
        }
        
        // Try OAuth token with /summary endpoints
        if (useOAuthToken) {
          attempts.push(
            { base: "https://api.enphaseenergy.com/api/v4", path: "summary", name: "v4/summary", useOAuthToken: true },
            { base: "https://api.enphaseenergy.com/api/v2", path: "summary", name: "v2/summary", useOAuthToken: true }
          );
        }
        
        // Also try cross-combinations
        if (useApiKey && useOAuthToken) {
          attempts.push(
            { base: "https://api.enphaseenergy.com/api/v4", path: "summary", name: "v4/summary (with API key)", useApiKey: true },
            { base: "https://api.enphaseenergy.com/api/v4", path: "production", name: "v4/production (with OAuth)", useOAuthToken: true }
          );
        }
        
        for (const attempt of attempts) {
          // Build URL and headers based on auth method
          let attemptUrlParams = [];
          let attemptHeaders = { ...headers };
          
          if (attempt.useApiKey && apiKey) {
            attemptUrlParams.push(`key=${apiKey}`);
            // Remove OAuth header if using API key
            delete attemptHeaders["Authorization"];
          }
          
          if (attempt.useOAuthToken && accessToken) {
            attemptHeaders["Authorization"] = `Bearer ${accessToken}`;
            // Remove API key from params if using OAuth
            attemptUrlParams = urlParams.filter(p => !p.startsWith('key='));
          }
          
          // Add date params
          if (summary_date) {
            attemptUrlParams.push(`summary_date=${summary_date}`);
          } else if (start_date && end_date) {
            attemptUrlParams.push(`start_date=${start_date}`, `end_date=${end_date}`);
          } else {
            attemptUrlParams.push(`summary_date=${today}`);
          }
          
          url = `${attempt.base}/systems/${systemId}/${attempt.path}?${attemptUrlParams.join('&')}`;
          console.log(`Trying ${attempt.name} endpoint:`, url.replace(/key=[^&]+/, 'key=***').substring(0, 100) + "...");
          console.log(`  Auth: ${attempt.useApiKey ? 'API Key' : 'OAuth Token'}`);
          
          response = await fetch(url, {
            method: "GET",
            headers: attemptHeaders,
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

