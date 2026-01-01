import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: Request) {
    try {
        const { item } = await req.json();

        if (!item) {
            return NextResponse.json({ category: 'other' });
        }

        const prompt = `Categorize the shopping item "${item}" into exactly one of these categories: 
        - produce
        - dairy
        - meat
        - pantry
        - household
        - frozen
        - beverages
        - other
        
        Return ONLY the category name in lowercase. No explanation.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        // Clean up text to match only expected categories
        let category = response.text().trim().toLowerCase().replace(/[^a-z]/g, '');

        const VALID_CATEGORIES = ['produce', 'dairy', 'meat', 'pantry', 'household', 'frozen', 'beverages', 'other'];
        if (!VALID_CATEGORIES.includes(category)) {
            category = 'other';
        }

        return NextResponse.json({ category });

    } catch (error) {
        console.error('Categorization error:', error);
        return NextResponse.json({ category: 'other' });
    }
}
