'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Note, ShoppingItem } from '../types';
import { supabase } from '@/lib/supabase';

interface DashboardContextType {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    shoppingList: ShoppingItem[];
    setShoppingList: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
    loading: boolean;
    // Helper methods for voice commands or quick actions
    addShoppingItem: (text: string) => Promise<void>;
    addNote: (text: string, color?: string) => Promise<void>;
    addProject: (title: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);

    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Synchronize with Supabase if available, else localStorage
    useEffect(() => {
        const loadData = async () => {
            if (isSupabaseConfigured) {
                try {
                    const [pRes, nRes, sRes] = await Promise.all([
                        supabase.from('projects').select('*').order('created_at', { ascending: false }),
                        supabase.from('notes').select('*').order('id', { ascending: true }),
                        supabase.from('shopping_list').select('*').order('created_at', { ascending: true })
                    ]);

                    if (pRes.data) setProjects(pRes.data);
                    if (nRes.data) setNotes(nRes.data);
                    if (sRes.data) setShoppingList(sRes.data);

                    if (!pRes.data && !nRes.data && !sRes.data) {
                        loadFromLocalStorage();
                    }
                } catch (e) {
                    console.error("Supabase load failed, falling back to localStorage", e);
                    loadFromLocalStorage();
                }
            } else {
                loadFromLocalStorage();
            }
            setLoading(false);
        };

        const loadFromLocalStorage = () => {
            const savedProjects = localStorage.getItem('home-hub-projects');
            const savedNotes = localStorage.getItem('home-hub-notes');
            const savedShopping = localStorage.getItem('shopping-list');

            if (savedProjects) setProjects(JSON.parse(savedProjects));
            if (savedNotes) setNotes(JSON.parse(savedNotes));
            if (savedShopping) setShoppingList(JSON.parse(savedShopping));
        };

        loadData();
    }, [isSupabaseConfigured]);

    // Persistence effects
    useEffect(() => {
        if (loading) return;
        localStorage.setItem('home-hub-projects', JSON.stringify(projects));
    }, [projects, loading]);

    useEffect(() => {
        if (loading) return;
        localStorage.setItem('home-hub-notes', JSON.stringify(notes));
    }, [notes, loading]);

    useEffect(() => {
        if (loading) return;
        localStorage.setItem('shopping-list', JSON.stringify(shoppingList));
    }, [shoppingList, loading]);

    // Helper methods
    const addShoppingItem = async (text: string) => {
        const id = Date.now().toString();
        const newItem: ShoppingItem = { id, text, checked: false, category: 'other' };
        setShoppingList(prev => [...prev, newItem]);
        if (isSupabaseConfigured) {
            await supabase.from('shopping_list').insert([newItem]);
        }
    };

    const addNote = async (text: string, color = 'bg-yellow-200') => {
        const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
        const newNote: Note = { id: newId, text, color, rotation: `rotate-${Math.floor(Math.random() * 6) - 3}` };
        setNotes(prev => [...prev, newNote]);
        if (isSupabaseConfigured) {
            await supabase.from('notes').insert([newNote]);
        }
    };

    const addProject = async (title: string) => {
        const newProject: Project = { id: crypto.randomUUID(), title, status: 'todo' };
        setProjects(prev => [newProject, ...prev]);
        if (isSupabaseConfigured) {
            await supabase.from('projects').insert([newProject]);
        }
    };

    return (
        <DashboardContext.Provider value={{
            projects, setProjects,
            notes, setNotes,
            shoppingList, setShoppingList,
            loading,
            addShoppingItem, addNote, addProject
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
