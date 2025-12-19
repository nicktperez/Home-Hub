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
                try {
                    const [pRes, nRes, sRes] = await Promise.all([
                        supabase.from('projects').select('*').order('created_at', { ascending: false }),
                        supabase.from('notes').select('*').order('id', { ascending: true }),
                        supabase.from('shopping_list').select('*').order('created_at', { ascending: true })
                    ]);

                    const localProjects = localStorage.getItem('home-hub-projects');
                    const localNotes = localStorage.getItem('home-hub-notes');
                    const localShopping = localStorage.getItem('shopping-list');

                    // Projects loading/fallback
                    if (pRes.data && pRes.data.length > 0) {
                        setProjects(pRes.data);
                    } else if (localProjects) {
                        setProjects(JSON.parse(localProjects));
                    }

                    // Notes loading/fallback
                    if (nRes.data && nRes.data.length > 0) {
                        setNotes(nRes.data);
                    } else if (localNotes) {
                        setNotes(JSON.parse(localNotes));
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
            await supabase.from('shopping_list').insert([newItem]);
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

    // Helper methods for Notes
    const addNote = async (text: string, color = 'bg-yellow-200') => {
        // Create a temporary ID for immediate UI update
        const tempId = Date.now();
        const newNote: Note = { id: tempId, text, color, rotation: `rotate-${Math.floor(Math.random() * 6) - 3}` };
        setNotes(prev => [...prev, newNote]);

        if (isSupabaseConfigured) {
            // Let Supabase generate the real ID (bigint identity)
            const { data, error } = await supabase.from('notes').insert([
                { text, color, rotation: newNote.rotation }
            ]).select();

            if (data && data[0]) {
                // Update the temp ID with the real ID from database
                setNotes(prev => prev.map(n => n.id === tempId ? data[0] : n));
            }
        }
    };

    const updateNote = async (id: number, updates: Partial<Note>) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
        if (isSupabaseConfigured) {
            await supabase.from('notes').update(updates).eq('id', id);
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
