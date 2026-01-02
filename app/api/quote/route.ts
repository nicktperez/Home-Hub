import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function GET() {
    try {
        const hour = new Date().getHours();
        let timeContext = "morning";
        if (hour >= 12 && hour < 17) timeContext = "afternoon";
        if (hour >= 17) timeContext = "evening";

        const prompt = `Generate a single, short, inspiring daily intention or quote (max 15 words) for the ${timeContext}.
        Examples: "find joy in the simple things", "rest deeply and recharge".
        Return ONLY the text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim().replace(/['"]/g, '');

        if (!text) throw new Error('Empty AI response');

        return NextResponse.json({ quote: text });

    } catch (error: any) {
        console.error('AI Quote Error:', error);
        return NextResponse.json({
            quote: "Choose Kindness",
            error: error.message || error.toString()
        });
    }
}
