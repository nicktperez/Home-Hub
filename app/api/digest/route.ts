import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: Request) {
    try {
        const { events } = await req.json();

        if (!events || events.length === 0) {
            return NextResponse.json({ summary: "A clear schedule. Enjoy your freedom!" });
        }

        const eventList = events.map((e: any) => `- ${e.summary} at ${new Date(e.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`).join("\n");

        const prompt = `Here is a daily schedule:
        ${eventList}
        
        Write a 1-sentence "Vibe Check" or summary for this day. 
        If it's busy, sound encouraging (e.g., "Power through it!"). 
        If it's light, sound relaxing. 
        Keep it under 15 words. Informal and friendly.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        return NextResponse.json({ summary: text });

    } catch (error) {
        console.error('Digest Error:', error);
        return NextResponse.json({ summary: "Go seize the day!" });
    }
}
