import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
    try {
        const { title } = await request.json();
        if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

        const newProject = {
            id: crypto.randomUUID(),
            title: title,
            status: 'todo',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('projects')
            .insert([newProject])
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
