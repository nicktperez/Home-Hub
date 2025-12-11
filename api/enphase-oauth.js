// Enphase OAuth 2.0 flow handler
// This endpoint handles the OAuth callback and token exchange

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const clientId = process.env.ENPHASE_CLIENT_ID;
  const clientSecret = process.env.ENPHASE_CLIENT_SECRET;
  const redirectUri = process.env.ENPHASE_REDIRECT_URI || 
    `${req.headers.origin || 'https://' + req.headers.host}/api/enphase-oauth`;

  if (req.method === "GET") {
    const { code, error } = req.query;

    // Step 1: User authorization - redirect to Enphase
    if (!code && !error) {
      if (!clientId) {
        return res.status(400).json({
          error: "Client ID not configured",
          message: "Please set ENPHASE_CLIENT_ID in environment variables"
        });
      }

      // Redirect to Enphase authorization URL
      const authUrl = `https://api.enphaseenergy.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      return res.redirect(302, authUrl);
    }

    // Step 2: Handle OAuth callback
    if (error) {
      return res.status(400).send(`
        <html>
          <body>
            <h1>OAuth Error</h1>
            <p>${error}</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
    }

    if (code) {
      if (!clientId || !clientSecret) {
        return res.status(500).send(`
          <html>
            <body>
              <h1>Configuration Error</h1>
              <p>Client ID or Client Secret not configured.</p>
            </body>
          </html>
        `);
      }

      try {
        // Exchange authorization code for access token
        const tokenUrl = "https://api.enphaseenergy.com/oauth/token";
        const tokenResponse = await fetch(tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          return res.status(400).send(`
            <html>
              <body>
                <h1>Token Exchange Failed</h1>
                <pre>${JSON.stringify(tokenData, null, 2)}</pre>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
        }

        // Success! Show the access token
        return res.send(`
          <html>
            <head>
              <title>Enphase OAuth Success</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                .token { background: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all; }
                .instructions { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px; }
                code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
              </style>
            </head>
            <body>
              <h1>✅ OAuth Authorization Successful!</h1>
              <p>Your access token:</p>
              <div class="token">
                <strong>${tokenData.access_token}</strong>
              </div>
              <div class="instructions">
                <h3>Next Steps:</h3>
                <ol>
                  <li>Copy the access token above</li>
                  <li>Add it to your Vercel environment variables:</li>
                  <li><code>vercel env add ENPHASE_ACCESS_TOKEN</code></li>
                  <li>Paste the token when prompted</li>
                  <li>Redeploy your application</li>
                </ol>
                <p><strong>Note:</strong> Access tokens expire. You may need to repeat this process when it expires.</p>
              </div>
            </body>
          </html>
        `);
      } catch (error) {
        return res.status(500).send(`
          <html>
            <body>
              <h1>Error</h1>
              <p>${error.message}</p>
            </body>
          </html>
        `);
      }
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};

