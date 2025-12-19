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

                    // If we got data, use it. If data is empty but we have local data, we might want to "merge" or keep local?
                    // For now, let's just use Supabase as source of truth if configured.
                    if (pRes.data) setProjects(pRes.data);
                    if (nRes.data) setNotes(nRes.data);
                    if (sRes.data) setShoppingList(sRes.data);

                    // Fallback to local storage ONLY if both Supabase returns nothing (null) AND we have local data.
                    // This handles the first-time setup scenario.
                    if (pRes.data?.length === 0 && nRes.data?.length === 0 && sRes.data?.length === 0) {
                        const localProjects = localStorage.getItem('home-hub-projects');
                        const localNotes = localStorage.getItem('home-hub-notes');
                        const localShopping = localStorage.getItem('shopping-list');

                        // If we have local data, let's use it and optionally push to Supabase?
                        // For simplicity, just load it so the user doesn't lose data.
                        if (localProjects) setProjects(JSON.parse(localProjects));
                        if (localNotes) setNotes(JSON.parse(localNotes));
                        if (localShopping) setShoppingList(JSON.parse(localShopping));
                    }
                } catch (e) {
                    console.error("Supabase load failed, falling back to localStorage", e);
                    const savedProjects = localStorage.getItem('home-hub-projects');
                    const savedNotes = localStorage.getItem('home-hub-notes');
                    const savedShopping = localStorage.getItem('shopping-list');

                    if (savedProjects) setProjects(JSON.parse(savedProjects));
                    if (savedNotes) setNotes(JSON.parse(savedNotes));
                    if (savedShopping) setShoppingList(JSON.parse(savedShopping));
                }
            } else {
                const savedProjects = localStorage.getItem('home-hub-projects');
                const savedNotes = localStorage.getItem('home-hub-notes');
                const savedShopping = localStorage.getItem('shopping-list');

                if (savedProjects) setProjects(JSON.parse(savedProjects));
                if (savedNotes) setNotes(JSON.parse(savedNotes));
                if (savedShopping) setShoppingList(JSON.parse(savedShopping));
            }
            setLoading(false);
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
        const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
        const newNote: Note = { id: newId, text, color, rotation: `rotate-${Math.floor(Math.random() * 6) - 3}` };
        setNotes(prev => [...prev, newNote]);
        if (isSupabaseConfigured) {
            await supabase.from('notes').insert([newNote]);
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

    // Helper methods for Projects
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
