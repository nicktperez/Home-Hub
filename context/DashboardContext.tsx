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
                console.log("DashboardContext: Starting initial sync with Supabase...");
                try {
                    const [pRes, nRes, sRes] = await Promise.all([
                        supabase.from('projects').select('*').order('created_at', { ascending: false }),
                        supabase.from('notes').select('*').order('id', { ascending: true }),
                        supabase.from('shopping_list').select('*').order('created_at', { ascending: true })
                    ]);

                    if (pRes.error) console.error("Supabase Projects Error:", pRes.error);
                    if (nRes.error) console.error("Supabase Notes Error:", nRes.error);
                    if (sRes.error) console.error("Supabase Shopping Error:", sRes.error);

                    console.log(`Cloud data counts - Projects: ${pRes.data?.length}, Notes: ${nRes.data?.length}, Shopping: ${sRes.data?.length}`);

                    const localProjects = localStorage.getItem('home-hub-projects');
                    const localNotes = localStorage.getItem('home-hub-notes');
                    const localShopping = localStorage.getItem('shopping-list');

                    // Projects loading/fallback
                    if (pRes.data && pRes.data.length > 0) {
                        setProjects(pRes.data);
                    } else if (localProjects) {
                        const parsed = JSON.parse(localProjects);
                        console.log("Seeding Projects from Local Storage to Cloud...");
                        setProjects(parsed);
                        // Optional: push to cloud if cloud is empty
                        if (!pRes.data || pRes.data.length === 0) {
                            supabase.from('projects').insert(parsed).then(() => console.log("Seeded Projects"));
                        }
                    }

                    // Notes loading/fallback
                    if (nRes.data && nRes.data.length > 0) {
                        setNotes(nRes.data);
                    } else if (localNotes) {
                        const parsed = JSON.parse(localNotes);
                        console.log("Seeding Notes from Local Storage to Cloud...");
                        setNotes(parsed);
                        if (!nRes.data || nRes.data.length === 0) {
                            // Filter notes to remove local IDs that might conflict with identity
                            const seedNotes = parsed.map((n: any) => ({ text: n.text, color: n.color, rotation: n.rotation }));
                            supabase.from('notes').insert(seedNotes).then(() => console.log("Seeded Notes"));
                        }
                    }

                    // Shopping List loading/fallback
                    if (sRes.data && sRes.data.length > 0) {
                        setShoppingList(sRes.data);
                    } else if (localShopping) {
                        setShoppingList(JSON.parse(localShopping));
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

    // Persistence to localStorage (Always keep a local copy for speed/offline)
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

    // Helper methods for Shopping List
    const addShoppingItem = async (text: string) => {
        const id = Date.now().toString();
        const newItem: ShoppingItem = { id, text, checked: false, category: 'other' };
        setShoppingList(prev => [...prev, newItem]);
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('shopping_list').insert([newItem]);
            if (error) console.error("Error adding shopping item:", error);
        }
    };

    const toggleShoppingItem = async (id: string, checked: boolean) => {
        setShoppingList(prev => prev.map(item => item.id === id ? { ...item, checked } : item));
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('shopping_list').update({ checked }).eq('id', id);
            if (error) console.error("Error toggling shopping item:", error);
        }
    };

    const deleteShoppingItem = async (id: string) => {
        setShoppingList(prev => prev.filter(item => item.id !== id));
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('shopping_list').delete().eq('id', id);
            if (error) console.error("Error deleting shopping item:", error);
        }
    };

    // Helper methods for Notes
    const addNote = async (text: string, color = 'bg-yellow-200') => {
        const tempId = Date.now();
        const rotation = `rotate-${Math.floor(Math.random() * 6) - 3}`;
        const newNote: Note = { id: tempId, text, color, rotation };

        setNotes(prev => [...prev, newNote]);

        if (isSupabaseConfigured) {
            try {
                console.log("Notes: Inserting into Supabase...");
                const { data, error } = await supabase.from('notes').insert([
                    { text, color, rotation }
                ]).select();

                if (error) throw error;

                if (data && data[0]) {
                    console.log("Notes: Sync Success, updating local ID", data[0].id);
                    setNotes(prev => prev.map(n => n.id === tempId ? data[0] : n));
                }
            } catch (e) {
                console.error("Error adding note to Supabase:", e);
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
            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (error) console.error("Error deleting note:", error);
        }
    };

    const addProject = async (title: string, status: Project['status'] = 'todo') => {
        const newProject: Project = { id: crypto.randomUUID(), title, status };
        setProjects(prev => [newProject, ...prev]);
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('projects').insert([newProject]);
            if (error) console.error("Error adding project:", error);
        }
    };

    const updateProject = async (id: string, updates: Partial<Project>) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('projects').update(updates).eq('id', id);
            if (error) console.error("Error updating project:", error);
        }
    };

    const deleteProject = async (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) console.error("Error deleting project:", error);
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
