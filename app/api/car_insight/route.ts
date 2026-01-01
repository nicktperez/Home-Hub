import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: Request) {
    try {
        const { carData } = await req.json();

        if (!carData) {
            return NextResponse.json({ insight: "Keep up with regular maintenance!" });
        }

        const prompt = `Here is the maintenance log for a family car:
        ${JSON.stringify(carData)}

        Task: Analyze the recent history.
        1. Identify the next likely maintenance needed (e.g. oil change, tire rotation) based on dates/mileage if available.
        2. Provide a 1-sentence "Mechanic's Insight" or tip.
        
        Example Output: "Based on your last oil change 6 months ago, you're due soon. Check tire pressure as winter approaches."
        Keep it friendly, helpful, and under 20 words.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        return NextResponse.json({ insight: text });

    } catch (error) {
        console.error('Car Insight Error:', error);
        return NextResponse.json({ insight: "Regular maintenance keeps your car running longer!" });
    }
}
