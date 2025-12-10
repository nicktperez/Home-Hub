// Weather API endpoint - proxies to OpenWeatherMap to avoid CORS issues
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Weather API key not configured" });
  }

  // Get location from query params or use default (you can make this configurable)
  const { lat, lon, city } = req.query || {};
  
  let url;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
  } else if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`;
  } else {
    // Default to Los Angeles if no location provided
    url = `https://api.openweathermap.org/data/2.5/weather?q=Los Angeles,CA,US&appid=${apiKey}&units=imperial`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    const data = await response.json();
    
    // Format the response
    const formatted = {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      city: data.name,
      country: data.sys.country,
    };
    
    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Weather API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch weather" });
  }
};

