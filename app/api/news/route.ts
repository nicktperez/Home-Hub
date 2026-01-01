import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function GET() {
    try {
        // Fetch from Good News Network RSS
        const feed = await parser.parseURL('https://www.goodnewsnetwork.org/feed/');

        // Take the top 3 headlines
        const potentialStories = feed.items.slice(0, 3).map(item => item.title).join("\n");

        if (!potentialStories) {
            throw new Error("No feed items found");
        }

        // Ask AI to summarize into a single ticker string
        const prompt = `Here are 3 uplifting news headlines:
        ${potentialStories}

        Select the ONE best/happiest story and rewrite it as a short, punchy ticker-tape style headline (max 12 words).
        It should sound exciting and positive.
        Return ONLY the headline text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const tickerText = response.text().trim().replace(/['"]/g, '');

        return NextResponse.json({ news: tickerText });

    } catch (error) {
        console.error('News Error:', error);
        // Fallback
        return NextResponse.json({ news: "Sunflowers bloom earlier this year, bringing color to local fields! 🌻" });
    }
}
