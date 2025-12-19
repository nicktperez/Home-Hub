import { useState } from 'react';
import { Plus, Check, Trash2, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';
import { useDashboard } from '@/context/DashboardContext';
import { ShoppingItem } from '@/types';
import GlassCard from './GlassCard';

export default function ShoppingList() {
    const {
        shoppingList: items,
        loading,
        addShoppingItem,
        toggleShoppingItem,
        deleteShoppingItem
    } = useDashboard();
    const [newItem, setNewItem] = useState('');

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        await addShoppingItem(newItem.trim());
        setNewItem('');
    };

    const toggleItem = async (id: string, checked: boolean) => {
        await toggleShoppingItem(id, checked);
    };

    const deleteItem = async (id: string) => {
        await deleteShoppingItem(id);
    };

    if (loading) return null;

    return (
        <GlassCard className="flex flex-col h-full bg-[#fdfaf5]/90 text-stone-800 overflow-hidden relative" hover={false}>

            {/* Paper Texture Effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#a8a29e 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

            {/* Header */}
            <div className="p-5 bg-stone-100/80 border-b border-stone-200 backdrop-blur-sm z-10 flex items-center justify-between">
                <h2 className="text-xl font-serif font-bold text-stone-700 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-stone-400" /> Market List
                </h2>
                <div className="text-xs font-medium text-stone-500 bg-white px-2 py-1 rounded-full shadow-sm border border-stone-200">
                    {items.filter(i => !i.checked).length} items remaining
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-transparent z-10">
                {items.map(item => (
                    <div
                        key={item.id}
                        onClick={() => toggleItem(item.id, !item.checked)}
                        className={clsx(
                            "flex items-center justify-between p-3 mx-2 rounded-lg cursor-pointer transition-all group",
                            item.checked
                                ? "opacity-50"
                                : "hover:bg-white hover:shadow-sm"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm",
                                item.checked
                                    ? "bg-stone-400 border-stone-400 text-white"
                                    : "bg-white border-stone-300 text-transparent hover:border-accent-clay"
                            )}>
                                <Check className="w-3.5 h-3.5" />
                            </div>
                            <span className={clsx(
                                "text-lg font-serif tracking-wide",
                                item.checked ? "line-through text-stone-400" : "text-stone-800"
                            )}>
                                {item.text}
                            </span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                            className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 p-2 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-stone-200 z-10">
                <form onSubmit={addItem} className="flex gap-2 shadow-sm rounded-lg overflow-hidden border border-stone-300 focus-within:ring-2 focus-within:ring-stone-400 transition-all">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Add to list..."
                        className="flex-1 bg-white px-4 py-3 focus:outline-none text-stone-800 placeholder-stone-400"
                    />
                    <button type="submit" className="bg-stone-800 hover:bg-stone-700 text-stone-50 px-5 flex items-center justify-center transition-colors">
                        <Plus className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </GlassCard>
    );
}
