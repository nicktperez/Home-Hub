// Weather API endpoint - proxies to OpenWeatherMap to avoid CORS issues
// Returns current weather, today's forecast, and 5-day forecast
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

  // Get location from query params or use default
  const { lat, lon, city } = req.query || {};
  
  let currentUrl, forecastUrl;
  if (lat && lon) {
    currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
  } else if (city) {
    currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`;
  } else {
    // Default to Los Angeles if no location provided
    currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=Los Angeles,CA,US&appid=${apiKey}&units=imperial`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=Los Angeles,CA,US&appid=${apiKey}&units=imperial`;
  }

  try {
    // Fetch both current weather and forecast
    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    if (!currentRes.ok) {
      throw new Error(`Current weather API error: ${currentRes.status}`);
    }
    if (!forecastRes.ok) {
      throw new Error(`Forecast API error: ${forecastRes.status}`);
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    // Format current weather
    const current = {
      temp: Math.round(currentData.main.temp),
      feelsLike: Math.round(currentData.main.feels_like),
      description: currentData.weather[0].description,
      icon: currentData.weather[0].icon,
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed || 0),
      city: currentData.name,
      country: currentData.sys.country,
      pressure: currentData.main.pressure,
      visibility: currentData.visibility ? (currentData.visibility / 1609.34).toFixed(1) : null, // Convert to miles
      sunrise: currentData.sys.sunrise,
      sunset: currentData.sys.sunset,
    };

    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter today's forecast entries
    const todayForecasts = forecastData.list.filter(item => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate >= today && itemDate < tomorrow;
    });

    // Calculate today's min/max and overall conditions
    let todayMin = current.temp;
    let todayMax = current.temp;
    let todayDescription = current.description;
    let todayIcon = current.icon;

    if (todayForecasts.length > 0) {
      const temps = todayForecasts.map(f => f.main.temp);
      todayMin = Math.round(Math.min(...temps, current.temp));
      todayMax = Math.round(Math.max(...temps, current.temp));
      // Use the most common description or current
      const descriptions = todayForecasts.map(f => f.weather[0].description);
      todayDescription = descriptions[Math.floor(descriptions.length / 2)] || current.description;
      todayIcon = todayForecasts[Math.floor(todayForecasts.length / 2)].weather[0].icon || current.icon;
    }

    const todaySummary = {
      min: todayMin,
      max: todayMax,
      description: todayDescription,
      icon: todayIcon,
      humidity: current.humidity,
      windSpeed: current.windSpeed,
    };

    // Process 5-day forecast (group by day, get daily min/max)
    const dailyForecast = {};
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toDateString();
      
      if (!dailyForecast[dayKey]) {
        dailyForecast[dayKey] = {
          date: date,
          temps: [],
          descriptions: [],
          icons: [],
          humidity: [],
          windSpeed: [],
        };
      }
      
      dailyForecast[dayKey].temps.push(item.main.temp);
      dailyForecast[dayKey].descriptions.push(item.weather[0].description);
      dailyForecast[dayKey].icons.push(item.weather[0].icon);
      dailyForecast[dayKey].humidity.push(item.main.humidity);
      dailyForecast[dayKey].windSpeed.push(item.wind.speed || 0);
    });

    // Convert to array and format
    const forecast = Object.values(dailyForecast)
      .slice(0, 5) // Get 5 days
      .map(day => {
        const min = Math.round(Math.min(...day.temps));
        const max = Math.round(Math.max(...day.temps));
        const avgIcon = day.icons[Math.floor(day.icons.length / 2)];
        const avgDesc = day.descriptions[Math.floor(day.descriptions.length / 2)];
        
        return {
          date: day.date.toISOString(),
          dayName: day.date.toLocaleDateString('en-US', { weekday: 'short' }),
          min,
          max,
          icon: avgIcon,
          description: avgDesc,
          humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
          windSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length),
        };
      });

    return res.status(200).json({
      current,
      today: todaySummary,
      forecast,
    });
  } catch (error) {
    console.error("Weather API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch weather" });
  }
};

