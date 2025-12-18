'use client';

export default function NotesWidget() {
    // Mock notes
    const notes = [
        { id: '1', text: 'Welcome Home! ❤️', color: 'bg-rose/10 text-rose border-rose/20' },
        { id: '2', text: 'WiFi: familyhub123', color: 'bg-sage/10 text-sage border-sage/20' },
    ];

    return (
        <div className="glass-card rounded-3xl p-6 flex flex-col h-full hover:bg-white/60 transition-all duration-500 cursor-pointer shadow-sm">
            <h3 className="text-[11px] font-bold text-rose uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <span>💭 Quick Reminders</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto">
                {notes.map(note => (
                    <div key={note.id} className={`${note.color} p-4 rounded-2xl shadow-sm text-sm font-serif italic font-bold border leading-snug transform hover:rotate-2 transition-transform h-24 flex items-center justify-center text-center`}>
                        {note.text}
                    </div>
                ))}
                <div className="border-2 border-dashed border-rose/20 rounded-2xl flex flex-col items-center justify-center text-rose font-black uppercase tracking-widest min-h-[96px] hover:bg-rose/5 transition-colors">
                    <span className="text-xl mb-1">+</span>
                    Add Note
                </div>
            </div>
        </div>
    );
}
