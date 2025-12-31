import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function GET() {
    try {
        const hour = new Date().getHours();
        let timeContext = "morning";
        if (hour >= 12 && hour < 17) timeContext = "afternoon";
        if (hour >= 17) timeContext = "evening";

        const prompt = `Generate a single, short, inspiring daily intention or quote(max 15 words). 
        The context is a ${timeContext}.
        Examples: "find joy in the simple things", "rest deeply and recharge", "tackle the day with courage".
        Return ONLY the text of the quote, no extra formatting.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim().replace(/['"]/g, '');

        if (!text) throw new Error('Empty AI response');

        return NextResponse.json({ quote: text });

    } catch (error) {
        console.error('AI error:', error);
        // Clean fallback
        return NextResponse.json({ quote: "Choose Kindness" });
    }
}
