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
    toggleShoppingItem: (id: string, checked: boolean) => Promise<void>;
    deleteShoppingItem: (id: string) => Promise<void>;
    addNote: (text: string, color?: string) => Promise<void>;
    updateNote: (id: number, updates: Partial<Note>) => Promise<void>;
    deleteNote: (id: number) => Promise<void>;
    addProject: (title: string, status?: Project['status']) => Promise<void>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);

    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-url');

    // Synchronize with Supabase if available, else localStorage
    useEffect(() => {
        const loadData = async () => {
            if (isSupabaseConfigured) {
                console.log("🔄 Dashboard Sync: Connecting to Supabase...");
                try {
                    const [pRes, nRes, sRes] = await Promise.all([
                        supabase.from('projects').select('*').order('created_at', { ascending: false }),
                        supabase.from('notes').select('*').order('id', { ascending: true }),
                        supabase.from('shopping_list').select('*').order('created_at', { ascending: true })
                    ]);

                    if (pRes.error) throw pRes.error;
                    if (nRes.error) throw nRes.error;
                    if (sRes.error) throw sRes.error;

                    console.log(`✅ Sync Success: Found ${pRes.data?.length} projects, ${nRes.data?.length} notes, ${sRes.data?.length} items.`);

                    const localProjects = localStorage.getItem('home-hub-projects');
                    const localNotes = localStorage.getItem('home-hub-notes');
                    const localShopping = localStorage.getItem('shopping-list');

                    // Decision Logic: If Cloud is empty AND Local has items, push Local to Cloud.
                    // Otherwise, Cloud wins.

                    if (pRes.data && pRes.data.length > 0) {
                        setProjects(pRes.data);
                    } else if (localProjects) {
                        const parsed = JSON.parse(localProjects);
                        if (parsed.length > 0) {
                            console.log("📤 Seeding projects to cloud...");
                            setProjects(parsed);
                            await supabase.from('projects').insert(parsed);
                        }
                    }

                    if (nRes.data && nRes.data.length > 0) {
                        setNotes(nRes.data);
                    } else if (localNotes) {
                        const parsed = JSON.parse(localNotes);
                        if (parsed.length > 0) {
                            console.log("📤 Seeding notes to cloud...");
                            setNotes(parsed);
                            const seedNotes = parsed.map((n: any) => ({ text: n.text, color: n.color, rotation: n.rotation }));
                            await supabase.from('notes').insert(seedNotes);
                        }
                    }

                    if (sRes.data && sRes.data.length > 0) {
                        setShoppingList(sRes.data);
                    } else if (localShopping) {
                        const parsed = JSON.parse(localShopping);
                        if (parsed.length > 0) {
                            setShoppingList(parsed);
                            await supabase.from('shopping_list').insert(parsed);
                        }
                    }

                } catch (e) {
                    console.error("❌ Supabase connection failed:", e);
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

    // Fast Local Persistence
    useEffect(() => {
        if (loading) return;
        localStorage.setItem('home-hub-projects', JSON.stringify(projects));
        localStorage.setItem('home-hub-notes', JSON.stringify(notes));
        localStorage.setItem('shopping-list', JSON.stringify(shoppingList));
    }, [projects, notes, shoppingList, loading]);

    // Persistence Methods
    const addShoppingItem = async (text: string) => {
        const newItem: ShoppingItem = { id: Date.now().toString(), text, checked: false, category: 'other' };
        setShoppingList(prev => [...prev, newItem]);
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('shopping_list').insert([newItem]);
            if (error) console.error("Error adding shopping item:", error);
        }
    };

    const toggleShoppingItem = async (id: string, checked: boolean) => {
        setShoppingList(prev => prev.map(item => item.id === id ? { ...item, checked } : item));
        if (isSupabaseConfigured) {
            await supabase.from('shopping_list').update({ checked }).eq('id', id);
        }
    };

    const deleteShoppingItem = async (id: string) => {
        setShoppingList(prev => prev.filter(item => item.id !== id));
        if (isSupabaseConfigured) {
            await supabase.from('shopping_list').delete().eq('id', id);
        }
    };

    const addNote = async (text: string, color = 'bg-yellow-200') => {
        const tempId = Date.now();
        const rotation = `rotate-${Math.floor(Math.random() * 6) - 3}`;
        const newNote: Note = { id: tempId, text, color, rotation };
        setNotes(prev => [...prev, newNote]);

        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase.from('notes').insert([{ text, color, rotation }]).select();
                if (error) throw error;
                if (data?.[0]) {
                    setNotes(prev => prev.map(n => n.id === tempId ? data[0] : n));
                }
            } catch (e) {
                console.error("Notes: Cloud save failed", e);
            }
        }
    };

    const updateNote = async (id: number, updates: Partial<Note>) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('notes').update(updates).eq('id', id);
            if (error) console.error("Error updating note:", error);
        }
    };

    const deleteNote = async (id: number) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        if (isSupabaseConfigured) {
            await supabase.from('notes').delete().eq('id', id);
        }
    };

    const addProject = async (title: string, status: Project['status'] = 'todo') => {
        const newProject: Project = { id: crypto.randomUUID(), title, status };
        setProjects(prev => [newProject, ...prev]);
        if (isSupabaseConfigured) {
            await supabase.from('projects').insert([newProject]);
        }
    };

    const updateProject = async (id: string, updates: Partial<Project>) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        if (isSupabaseConfigured) {
            await supabase.from('projects').update(updates).eq('id', id);
        }
    };

    const deleteProject = async (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (isSupabaseConfigured) {
            await supabase.from('projects').delete().eq('id', id);
        }
    };


    return (
        <DashboardContext.Provider value={{
            projects, setProjects,
            notes, setNotes,
            shoppingList, setShoppingList,
            loading,
            addShoppingItem, toggleShoppingItem, deleteShoppingItem,
            addNote, updateNote, deleteNote,
            addProject, updateProject, deleteProject
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
