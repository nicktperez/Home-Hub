'use client';

import { CloudSun, Droplets, MapPin, Wind } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Weather() {
    const [location, setLocation] = useState<{ lat: number; long: number } | null>(null);
    const [weatherData, setWeatherData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [locationName, setLocationName] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, long: longitude });

                try {
                    // Fetch Weather
                    const weatherRes = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`
                    );
                    const weatherJson = await weatherRes.json();
                    setWeatherData(weatherJson);

                    // Fetch City Name (Reverse Geocoding via Proxy)
                    console.log(`Fetching location for ${latitude}, ${longitude}`);
                    const geoRes = await fetch(
                        `/api/weather?lat=${latitude}&long=${longitude}`
                    );
                    if (!geoRes.ok) throw new Error("Geo proxy failed");

                    const geoJson = await geoRes.json();
                    console.log("Geo response:", geoJson);

                    if (geoJson.results && geoJson.results[0]) {
                        const city = geoJson.results[0].name || geoJson.results[0].city || "Unknown City";
                        setLocationName(city);
                    } else if (geoJson.error) {
                        console.error("Geo API Error:", geoJson.error);
                    }
                } catch (e) {
                    console.error(e);
                    setError("Failed to fetch weather data");
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setError("Location access denied");
                setLoading(false);
            }
        );
    }, []);

    // Helper to map WMO codes to Icons/Text
    const getWeatherInfo = (code: number) => {
        if (code === 0) return { icon: <CloudSun className="w-12 h-12 text-terracotta" />, text: 'Sunny Day' };
        if (code <= 3) return { icon: <CloudSun className="w-12 h-12 text-sage" />, text: 'Partly Cloudy' };
        if (code <= 48) return { icon: <Wind className="w-12 h-12 text-rose" />, text: 'Hazy' };
        if (code <= 67) return { icon: <Droplets className="w-12 h-12 text-sage" />, text: 'Light Rain' };
        return { icon: <CloudSun className="w-12 h-12 text-rose" />, text: 'Cloudy' };
    };

    const getClothingSuggestion = (temp: number) => {
        if (temp > 80) return "It's a sundress kind of day! 👗";
        if (temp > 70) return "T-shirt weather is here! 👕";
        if (temp > 60) return "Perfect for a light sweater. 🧥";
        if (temp > 50) return "Layer up with a cozy cardigan. 🧶";
        if (temp > 40) return "Definitely need a warm coat today. 🧥";
        return "Bundle up, it's chilly! 🧣";
    };

    const currentInfo = weatherData ? getWeatherInfo(weatherData.current.weather_code) : { icon: null, text: '' };
    const clothing = weatherData ? getClothingSuggestion(weatherData.current.temperature_2m) : '';

    return (
        <div className="glass-card rounded-3xl p-8 flex flex-col justify-between h-full transition-all duration-500 overflow-hidden">
            <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-rose font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-terracotta" />
                    {locationName || "Local Skies"}
                </div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="drop-shadow-sm scale-125 transition-transform hover:rotate-6 duration-300">
                            {currentInfo.icon}
                        </div>
                        <div>
                            <div className="text-5xl font-serif font-bold text-cocoa leading-none">
                                {weatherData?.current?.temperature_2m
                                    ? Math.round(weatherData.current.temperature_2m) + "°"
                                    : "--"}
                            </div>
                            <div className="text-sm text-secondary font-medium mt-1">
                                {currentInfo.text}
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="text-xs text-rose font-bold mb-1 italic">RealFeel</div>
                        <div className="text-xl font-serif font-bold text-terracotta text-shadow-sm">
                            {weatherData ? Math.round(weatherData.current.apparent_temperature) : '--'}°
                        </div>
                    </div>
                </div>

                {/* Clothing Advice */}
                <div className="mb-6 p-4 bg-white/60 rounded-2xl text-center text-sm font-bold text-cocoa shadow-sm border border-white/80">
                    {clothing || "Checking the forecast..."}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-rose/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sage/20 rounded-xl">
                            <Droplets className="w-4 h-4 text-sage" />
                        </div>
                        <div>
                            <div className="text-[10px] text-rose font-black uppercase tracking-wider leading-none mb-1">Humidity</div>
                            <div className="text-sm font-black text-cocoa">
                                {weatherData ? weatherData.current.relative_humidity_2m : '--'}%
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-terracotta/20 rounded-xl">
                            <Wind className="w-4 h-4 text-terracotta" />
                        </div>
                        <div>
                            <div className="text-[10px] text-rose font-black uppercase tracking-wider leading-none mb-1">Breeze</div>
                            <div className="text-sm font-black text-cocoa">
                                {weatherData ? Math.round(weatherData.current.wind_speed_10m) : '--'} mph
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5-Day Mini Forecast */}
                <div className="mt-4 pt-4 border-t border-rose/20">
                    <h3 className="text-[10px] font-black text-rose uppercase tracking-[0.2em] mb-3">Thinking Ahead</h3>
                    <div className="flex justify-between gap-1">
                        {weatherData && weatherData.daily.time.slice(0, 5).map((time: string, i: number) => {
                            const date = new Date(time);
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                            const maxTemp = Math.round(weatherData.daily.temperature_2m_max[i]);
                            const code = weatherData.daily.weather_code[i];
                            let Icon = CloudSun;
                            if (code > 50) Icon = Droplets;

                            return (
                                <div key={i} className="flex flex-col items-center gap-1 group">
                                    <span className="text-[10px] font-bold text-secondary uppercase mb-1">{dayName}</span>
                                    <div className="p-1.5 rounded-lg bg-white/20 group-hover:bg-rose/10 transition-colors">
                                        <Icon className="w-3 h-3 text-terracotta" />
                                    </div>
                                    <span className="text-xs font-bold text-cocoa mt-1">{maxTemp}°</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
