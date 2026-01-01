import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
        }

        // Context for the AI to know it's acting as a Home Assistant
        const sysPrompt = `You are a helpful Family Home Assistant database. 
        Keep your answers concise (under 40 words if possible) and friendly. 
        Formatting: Use simple text, avoiding markdown if possible as you are being spoken/displayed on a dashboard.
        User Query: ${prompt}`;

        const result = await model.generateContent(sysPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error) {
        console.error('AI Chat error:', error);
        return NextResponse.json({ error: "Failed to think of a response." }, { status: 500 });
    }
}
