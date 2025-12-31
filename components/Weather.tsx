'use client';

import { CloudSun, Droplets, MapPin, Wind } from 'lucide-react';
import { useEffect, useState } from 'react';
import GlassCard from './GlassCard';

interface WeatherCurrent {
    temperature_2m: number;
    weather_code: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    apparent_temperature: number;
}

interface WeatherDaily {
    time: string[];
    temperature_2m_max: number[];
    weather_code: number[];
}

interface WeatherResponse {
    current: WeatherCurrent;
    daily: WeatherDaily;
}

export default function Weather() {
    const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
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
                try {
                    // Fetch Weather
                    const weatherRes = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`
                    );
                    const weatherJson: WeatherResponse = await weatherRes.json();
                    setWeatherData(weatherJson);

                    // Fetch City Name (Reverse Geocoding via Proxy)
                    const geoRes = await fetch(
                        `/api/weather?lat=${latitude}&long=${longitude}`
                    );
                    if (!geoRes.ok) throw new Error("Geo proxy failed");

                    const geoJson = await geoRes.json();

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

    const getClothingSuggestion = (temp: number, code: number) => {
        if (code >= 95) return "Stay inside, it's stormy! 🌩️";
        if (code >= 51 && code <= 67) return "Don't forget your umbrella! ☔";
        if (code >= 71) return "Snow day gear required! ❄️";

        if (temp > 95) return "Stay hydrated & find AC! 🥵";
        if (temp > 85) return "Pool weather! 🩳";
        if (temp > 75) return "T-shirt & shorts weather! 👕";
        if (temp > 65) return "Perfect for a light layer. 🧥";
        if (temp > 55) return "Sweater weather is here. 🧶";
        if (temp > 45) return "Grab a warm jacket. 🧥";
        if (temp > 32) return "Winter coat essentials. 🧣";
        return "Bundle up, it's freezing! 🥶";
    };

    const currentInfo = weatherData ? getWeatherInfo(weatherData.current.weather_code) : { icon: null, text: '' };
    const clothing = weatherData ? getClothingSuggestion(weatherData.current.temperature_2m, weatherData.current.weather_code) : '';

    return (
        <GlassCard className="p-5 lg:p-6 flex flex-col justify-between h-full group" hover={true}>
            <div className="h-full flex flex-col justify-between overflow-hidden">
                <div className="flex-shrink-0">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-rose font-bold mb-2 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-terracotta" />
                        {locationName || "Local Skies"}
                    </div>
                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="drop-shadow-sm scale-90 lg:scale-110 transition-transform group-hover:rotate-6 duration-300">
                                {currentInfo.icon}
                            </div>
                            <div>
                                <div className="text-2xl lg:text-4xl font-serif font-bold text-cocoa leading-none">
                                    {weatherData?.current?.temperature_2m
                                        ? Math.round(weatherData.current.temperature_2m) + "°"
                                        : "--"}
                                </div>
                                <div className="text-[9px] lg:text-[11px] text-secondary font-bold mt-0.5">
                                    {currentInfo.text}
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="text-[8px] lg:text-[10px] text-rose font-bold italic">RealFeel</div>
                            <div className="text-base lg:text-lg font-serif font-bold text-terracotta text-shadow-sm">
                                {weatherData ? Math.round(weatherData.current.apparent_temperature) : '--'}°
                            </div>
                        </div>
                    </div>

                    {/* Clothing Advice */}
                    <div className="mb-2 lg:mb-3 p-2 lg:p-2.5 bg-white/60 rounded-xl text-center text-[11px] lg:text-[13px] font-bold text-cocoa shadow-sm border border-white/80">
                        {clothing || "Checking the forecast..."}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 lg:gap-3 pb-2 lg:pb-3 border-b border-rose/10">
                        <div className="flex items-center gap-1.5 lg:gap-2">
                            <div className="p-1 lg:p-1.5 bg-sage/20 rounded-lg">
                                <Droplets className="w-3 lg:w-3.5 h-3 lg:h-3.5 text-sage" />
                            </div>
                            <div>
                                <div className="text-[8px] lg:text-[9px] text-rose font-black uppercase tracking-wider leading-none mb-0.5">Humid</div>
                                <div className="text-[10px] lg:text-xs font-black text-cocoa">
                                    {weatherData ? weatherData.current.relative_humidity_2m : '--'}%
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 lg:gap-2">
                            <div className="p-1 lg:p-1.5 bg-terracotta/20 rounded-lg">
                                <Wind className="w-3 lg:w-3.5 h-3 lg:h-3.5 text-terracotta" />
                            </div>
                            <div>
                                <div className="text-[8px] lg:text-[9px] text-rose font-black uppercase tracking-wider leading-none mb-0.5">Breeze</div>
                                <div className="text-[10px] lg:text-xs font-black text-cocoa">
                                    {weatherData ? Math.round(weatherData.current.wind_speed_10m) : '--'} mph
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5-Day Mini Forecast */}
                <div className="pt-2 lg:pt-3">
                    <h3 className="text-[8px] lg:text-[9px] font-black text-rose uppercase tracking-[0.2em] mb-2 lg:mb-3 text-center lg:text-left">Thinking Ahead</h3>
                    <div className="flex justify-between gap-1 overflow-x-auto no-scrollbar">
                        {weatherData?.daily?.time && weatherData.daily.time.slice(0, 5).map((time: string, i: number) => {
                            const date = new Date(time);
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                            const maxTemp = Math.round(weatherData.daily.temperature_2m_max[i]);
                            const code = weatherData.daily.weather_code[i];
                            const { icon } = getWeatherInfo(code);

                            return (
                                <div key={i} className="flex flex-col items-center gap-1 group/day shrink-0 min-w-[45px] lg:min-w-0">
                                    <span className="text-[8px] lg:text-[9px] font-bold text-secondary uppercase mb-0.5">{dayName}</span>
                                    <div className="p-1 rounded-lg bg-white/20 group-hover/day:bg-rose/10 transition-colors scale-75 lg:scale-100">
                                        {icon}
                                    </div>
                                    <span className="text-[10px] lg:text-[11px] font-bold text-cocoa mt-0.5">{maxTemp}°</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
