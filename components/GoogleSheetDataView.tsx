'use client';

import { useState, useEffect, useRef } from 'react';
import { Wrench, Calendar, ChevronRight, RefreshCw, AlertCircle, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface SheetRow {
    [key: string]: string;
}

interface SheetSection {
    title: string;
    headers: string[];
    rows: string[][];
}

export default function GoogleSheetDataView({ csvUrl }: { csvUrl: string }) {
    const [sections, setSections] = useState<SheetSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [sheetUrl, setSheetUrl] = useState(csvUrl);
    const [urlInput, setUrlInput] = useState(csvUrl);
    const [showConfig, setShowConfig] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('google-sheet-url');
        if (saved) {
            setSheetUrl(saved);
            setUrlInput(saved);
        }
    }, []);

    const fetchData = async (targetUrl?: string) => {
        const url = targetUrl || sheetUrl;
        if (!url) return;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error('Failed to fetch sheet data');
            const csvText = await response.text();
            parseCSV(csvText);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            if ((err as Error).name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const parseCSV = (text: string) => {
        const rows = parseCsvToRows(text).filter(r => r.some(cell => cell.trim() !== ''));
        const newSections: SheetSection[] = [];
        let currentSection: SheetSection | null = null;

        rows.forEach(parts => {
            const firstCell = (parts[0] || '').trim();
            const isDate = /^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})/.test(firstCell);

            if (!isDate && parts.length > 1 && (parts[1] || '').trim() !== '') {
                if (currentSection) {
                    currentSection.rows.sort((a: string[], b: string[]) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
                    newSections.push(currentSection);
                }
                currentSection = {
                    title: firstCell,
                    headers: parts.slice(1).filter(h => h.trim() !== ''),
                    rows: [],
                };
            } else if (currentSection) {
                currentSection.rows.push(parts.map(cell => cell.trim()));
            }
        });

        if (currentSection) {
            const section: SheetSection = currentSection;
            section.rows.sort((a: string[], b: string[]) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
            newSections.push(section);
        }
        setSections(newSections);
    };

    const parseCsvToRows = (text: string): string[][] => {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentValue = '';
        let inQuotes = false;

        const pushValue = () => {
            currentRow.push(currentValue);
            currentValue = '';
        };

        const pushRow = () => {
            rows.push(currentRow);
            currentRow = [];
        };

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const next = text[i + 1];

            if (char === '"') {
                if (inQuotes && next === '"') {
                    currentValue += '"';
                    i++; // skip next
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (char === ',' && !inQuotes) {
                pushValue();
                continue;
            }

            if ((char === '\n' || char === '\r') && !inQuotes) {
                // handle \r\n together
                if (char === '\r' && next === '\n') i++;
                pushValue();
                pushRow();
                continue;
            }

            currentValue += char;
        }

        // push last value/row
        pushValue();
        if (currentRow.length > 0) {
            pushRow();
        }

        return rows;
    };

    const isOilOverdue = (dateStr: string) => {
        const today = new Date();
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        const diffMonths = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        return diffMonths > 6;
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), 60000 * 5); // Refresh every 5 mins
        return () => {
            clearInterval(interval);
            abortRef.current?.abort();
        };
    }, [sheetUrl]);

    if (loading && sections.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-cocoa/40">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="font-serif italic text-lg text-cocoa/60 animate-pulse">Gathering your logs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-80 flex flex-col items-center justify-center gap-4 text-rose bg-rose/5 rounded-3xl border border-rose/20 p-8 text-center">
                <AlertCircle className="w-12 h-12" />
                <div>
                    <h3 className="text-xl font-serif font-bold">Something went wrong</h3>
                    <p className="text-sm opacity-80 mt-1">{error}</p>
                </div>
                <button
                    onClick={() => fetchData()}
                    className="px-6 py-2 bg-rose text-white rounded-full text-sm font-bold shadow-sm hover:scale-105 transition-transform"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col gap-8 pb-12 overflow-y-auto custom-scrollbar pr-2">
            <div className="flex justify-end px-2 mb-2 lg:mb-4">
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-[10px] font-black text-cocoa/40 uppercase tracking-widest flex items-center gap-2 hover:text-rose transition-colors"
                >
                    <Settings className="w-3 h-3" />
                    {showConfig ? 'Hide Config' : 'Sheet Settings'}
                </button>
            </div>

            {showConfig && (
                <form
                    className="glass-card rounded-[32px] border border-white/40 shadow-sm p-4 lg:p-6 mb-6 flex flex-wrap items-center gap-4 transition-all animate-in fade-in slide-in-from-top-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!urlInput.trim()) return;
                        setSheetUrl(urlInput.trim());
                        localStorage.setItem('google-sheet-url', urlInput.trim());
                        fetchData(urlInput.trim());
                        setShowConfig(false);
                    }}
                >
                    <div className="flex flex-col flex-1 min-w-[240px]">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cocoa/60 mb-1 px-1">
                            Google Sheet CSV URL
                        </label>
                        <input
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl border border-white/50 bg-white/60 text-sm text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:ring-2 focus:ring-rose/30"
                            placeholder="Paste CSV export link"
                        />
                    </div>
                    <div className="flex items-end gap-2 w-full lg:w-auto">
                        <button
                            type="submit"
                            className="flex-1 lg:flex-none px-6 py-2.5 rounded-full bg-rose text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all"
                        >
                            Save & Load
                        </button>
                        <button
                            type="button"
                            onClick={() => fetchData()}
                            className="px-4 py-2.5 rounded-full border border-cocoa/10 text-[10px] font-black text-cocoa/70 bg-white/40 hover:bg-white/60 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
                            Sync
                        </button>
                    </div>
                </form>
            )}

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 px-2">
                <div>
                    <h2 className="text-2xl lg:text-4xl font-serif font-black text-cocoa flex items-center gap-3">
                        Maintenance Hub
                    </h2>
                    <p className="text-xs lg:text-sm text-secondary font-medium mt-1 italic opacity-80 font-sans">Real-time data from your Google Sheet.</p>
                </div>
                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 w-full lg:w-auto">
                    <button
                        onClick={() => fetchData()}
                        className="flex-1 lg:flex-none text-[9px] lg:text-[10px] font-black text-rose uppercase tracking-[0.2em] bg-rose/5 px-4 py-2 lg:py-1.5 rounded-full border border-rose/10 shadow-inner flex items-center justify-center gap-2 hover:bg-rose/10 transition-colors group"
                    >
                        <RefreshCw className={clsx("w-3 h-3 group-hover:rotate-180 transition-transform duration-500", loading && "animate-spin")} />
                        Refresh Data
                    </button>
                    {lastUpdated && (
                        <p className="text-[8px] lg:text-[9px] font-medium text-cocoa/30 font-sans uppercase tracking-tight">
                            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <AnimatePresence mode="popLayout">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card rounded-[40px] p-8 border border-white/40 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500"
                        >
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-sage/5 rounded-bl-full -mr-8 -mt-8 transition-all duration-500 group-hover:scale-110"></div>

                            <div className="relative mb-6 flex items-center gap-4">
                                <div className="w-14 h-14 bg-rose/10 rounded-2xl flex items-center justify-center text-rose shadow-inner ring-1 ring-rose/20">
                                    <Wrench className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif font-black text-cocoa">{section.title}</h3>
                                    {(() => {
                                        const oilColIdx = section.headers.findIndex(h => h.toLowerCase().includes('oil'));

                                        // AI Insight Integration (only fetch once per section valid load)
                                        const [aiInsight, setAiInsight] = useState<string | null>(null);
                                        useEffect(() => {
                                            if (section.rows.length > 0) {
                                                // Send just the latest 3 rows to save tokens/bandwidth
                                                const recentData = section.rows.slice(0, 3).map(r => ({ date: r[0], details: r.slice(1) }));

                                                fetch('/api/car_insight', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ carData: { vehicle: section.title, history: recentData } })
                                                })
                                                    .then(res => res.json())
                                                    .then(data => setAiInsight(data.insight))
                                                    .catch(err => console.error("Car AI Error", err));
                                            }
                                        }, [section.title]); // Only run on mount/title change

                                        if (oilColIdx === -1) return (
                                            <div className="mt-2 min-h-[20px]">
                                                {aiInsight && (
                                                    <p className="text-xs font-serif italic text-cocoa/60 border-l-2 border-rose/30 pl-2 animate-in fade-in">
                                                        "{aiInsight}"
                                                    </p>
                                                )}
                                            </div>
                                        );

                                        // Find the most recent oil change (rows are already sorted desc)
                                        const latestOilRow = section.rows.find(row => row[oilColIdx + 1] && row[oilColIdx + 1] !== '');
                                        const needsAttention = latestOilRow ? isOilOverdue(latestOilRow[0]) : false;

                                        return (
                                            <div className="flex flex-col gap-2 mt-1">
                                                <div className="flex items-center gap-2">
                                                    {needsAttention ? (
                                                        <span className="text-[10px] font-black text-rose bg-rose/10 px-2 py-0.5 rounded-md uppercase tracking-wider border border-rose/10 flex items-center gap-1.5 animate-pulse">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose"></span>
                                                            Oil Change Recommended
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-md uppercase tracking-wider border border-sage/10 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-sage"></span>
                                                            Maintenance Up to Date
                                                        </span>
                                                    )}
                                                </div>
                                                {aiInsight && (
                                                    <p className="text-xs font-serif italic text-cocoa/60 border-l-2 border-rose/30 pl-2 animate-in fade-in">
                                                        "{aiInsight}"
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {section.rows.map((row, rowIdx) => (
                                    <div
                                        key={rowIdx}
                                        className="flex items-center gap-3 lg:gap-6 p-2 lg:p-4 rounded-3xl bg-white/30 border border-white/60 shadow-sm hover:bg-white/50 transition-colors group/row"
                                    >
                                        <div className="flex flex-col items-center justify-center min-w-[60px] lg:min-w-[70px] h-[60px] lg:h-[70px] bg-cocoa/5 rounded-2xl border border-cocoa/5 shadow-inner shrink-0">
                                            <Calendar className="w-3 h-3 lg:w-4 lg:h-4 text-cocoa/40 mb-0.5 lg:mb-1" />
                                            <span className="text-[10px] lg:text-xs font-black text-cocoa font-sans">{row[0]}</span>
                                        </div>

                                        <div className="flex-1 overflow-x-auto no-scrollbar">
                                            <div className="flex gap-4 lg:gap-6">
                                                {section.headers.map((h, hIdx) => {
                                                    const val = row[hIdx + 1];
                                                    if (!val || val === '') return null;
                                                    return (
                                                        <div key={hIdx} className="flex flex-col gap-1 min-w-[100px]">
                                                            <span className="text-[9px] font-black text-rose/60 uppercase tracking-[0.1em]">{h}</span>
                                                            <p className="text-sm font-serif font-bold text-cocoa/80 leading-tight">
                                                                {val && val.includes('xxx') ? (
                                                                    <span className="italic opacity-60">{val}</span>
                                                                ) : val}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/50 group-hover/row:bg-rose group-hover/row:text-white transition-all text-cocoa/20">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
