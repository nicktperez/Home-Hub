import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const location = searchParams.get('location') || 'World';

        // Use Google News RSS for specific positive query
        const rssUrl = `https://news.google.com/rss/search?q=uplifting+good+news+in+${encodeURIComponent(location)}&hl=en-US&gl=US&ceid=US:en`;
        const feed = await parser.parseURL(rssUrl);

        // Take top 5
        const items = feed.items.slice(0, 5);

        if (items.length === 0) throw new Error("No feed items found");

        const headlines = items.map(i => i.title).join("\n---\n");

        const prompt = `Here are news headlines:
        ${headlines}

        Task: Select the 3 most positive, non-political, uplifting stories.
        Rewrite each one into a short ticker-tape style headline (max 10 words).
        Return them separated by feature ' || '.
        Example: Local Park Opens New Garden || Firefighters Rescue Kitten || High School Wins Championship
        RETURN ONLY THE TEXT.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        const newsItems = text.split('||').map(s => s.trim()).filter(s => s.length > 0);

        return NextResponse.json({ news: newsItems });

    } catch (error: any) {
        console.error('News API Error:', error.message);
        return NextResponse.json({
            news: [
                "Sunflowers blooming early this year 🌻",
                "Local library waives all fees 📚",
                "Community garden reports record harvest 🥕"
            ]
        });
    }
}
