import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const location = searchParams.get('location') || 'US';

        // Google News RSS with a query for "Good News" + Location
        const rssUrl = `https://news.google.com/rss/search?q=uplifting+good+news+in+${encodeURIComponent(location)}&hl=en-US&gl=US&ceid=US:en`;

        const feed = await parser.parseURL(rssUrl);

        // Take top 5 items
        const items = feed.items.slice(0, 5);

        if (items.length === 0) throw new Error("No feed items found");

        // Format for AI: "Title || Source"
        // Google News RSS titles are usually "Headline - Source"
        const headlines = items.map(i => i.title || '').join("\n");

        const prompt = `Here are news headlines:
        ${headlines}

        Task: Select the 3 most genuinely positive, uplifting stories. 
        Rewrite the headline to be short (max 12 words) and catchy.
        Identify the source (e.g. "CNN", "Local News", "NYT").
        
        Format the output precisely as:
        Headline | Source Name
        Headline | Source Name
        Headline | Source Name
        
        Do not add numbering. Do not add markdown.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Parse lines
        const newsItems = text.split('\n').map(line => {
            // Handle cases where | might be inside the headline, split by last occurrence of | if possible, or usually just the separator
            const parts = line.split('|');
            if (parts.length < 2) return null;

            const source = parts.pop()?.trim() || 'Unknown';
            const headline = parts.join('|').trim(); // rejoin in case there were other | char

            if (headline && source) return { text: headline, source };
            return null;
        }).filter(item => item !== null);

        // Fallback if AI output format was weird or empty
        if (newsItems.length === 0) {
            throw new Error("AI parsing failed");
        }

        return NextResponse.json({ news: newsItems });

    } catch (error: any) {
        console.error('News API Error:', error.message);
        return NextResponse.json({
            news: [
                { text: "Sunflowers blooming early this year", source: "Nature Daily" },
                { text: "Local library waives all fees forever", source: "City Gazette" },
                { text: "Firefighters rescue stuck kitten", source: "Good News Network" }
            ]
        });
    }
}
