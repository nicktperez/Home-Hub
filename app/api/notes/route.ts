import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
    try {
        const { content, color } = await request.json();
        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

        const newNote = {
            text: content,
            color: color || 'bg-yellow-200',
            rotation: `rotate-${Math.floor(Math.random() * 6) - 3}`,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('notes')
            .insert([newNote])
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
