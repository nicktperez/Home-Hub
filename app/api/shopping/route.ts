import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
    try {
        const { item } = await request.json();
        if (!item) return NextResponse.json({ error: 'Item is required' }, { status: 400 });

        const newItem = {
            id: Date.now().toString(),
            text: item,
            checked: false,
            category: 'other',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('shopping_list')
            .insert([newItem])
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
