import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const long = searchParams.get('long');

    if (!lat || !long) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // 1. Try Open-Meteo Geocoding
    try {
        const openMeteoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${long}&count=1&language=en&format=json`,
            { headers: { 'User-Agent': 'Home-Hub-Next/1.0' } }
        );

        if (openMeteoRes.ok) {
            const data = await openMeteoRes.json();
            if (data.results && data.results[0]) {
                return NextResponse.json(data);
            }
        }
    } catch (e) {
        console.warn("Open-Meteo Geocoding failed, trying fallback...", e);
    }

    // 2. Fallback: BigDataCloud (Free, No Key)
    try {
        const fallbackRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}&localityLanguage=en`
        );
        if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            // Transform to match Open-Meteo structure for frontend consistency
            return NextResponse.json({
                results: [{
                    name: data.city || data.locality || data.principalSubdivision || "Unknown Location",
                    admin1: data.principalSubdivision
                }]
            });
        }
    } catch (e) {
        console.error("All geocoding fallbacks failed", e);
    }

    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
}
