'use client';

import { useState, useEffect } from 'react';
import Slide from '../components/Slide';
import Navigation from '../components/Navigation';
import Clock from '../components/Clock';
import Weather from '../components/Weather';
import CalendarDataView from '../components/CalendarDataView';
import ProjectBoard from '../components/ProjectBoard';
import ShoppingList from '../components/ShoppingList';
import NoteBoard from '../components/NoteBoard';
import ProjectWidget from '../components/ProjectWidget';
import NotesWidget from '../components/NotesWidget';
import FocusWidget from '../components/FocusWidget';
import GoogleSheetDataView from '../components/GoogleSheetDataView';
import CalendarWidget from '../components/CalendarWidget';
import VoiceCommander from '../components/VoiceCommander';

const ICAL_URL = "https://calendar.google.com/calendar/ical/19fc18fe1e0342336012fb0530d644d8c3ea9d6e14fe63b65db9b8b1ade07504%40group.calendar.google.com/public/basic.ics";

const SLIDE_TITLES = [
  "Month",
  "Today",
  "Projects",
  "Notes",
  "Shopping",
  "Car Info"
];

const SLIDE_DURATIONS = [
  20000, // Month
  45000, // Today
  20000, // Projects
  20000, // Notes
  20000, // Shopping
  30000  // Sheets
];

export default function Dashboard() {
  const [activeSlide, setActiveSlide] = useState(1); // Default to Today
  const [paused, setPaused] = useState(false);
  const [dimMode, setDimMode] = useState<'auto' | 'light' | 'dark'>('auto');
  const [isDimmed, setIsDimmed] = useState(false);

  // Auto-scroll Timer
  useEffect(() => {
    if (paused) return;

    const duration = SLIDE_DURATIONS[activeSlide] || 20000;
    const timer = setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDE_TITLES.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [activeSlide, paused]);

  // Load Dim Preference
  useEffect(() => {
    const saved = localStorage.getItem('home-hub-dim-mode');
    if (saved === 'auto' || saved === 'light' || saved === 'dark') {
      setDimMode(saved);
    }
  }, []);

  // Save Dim Preference
  useEffect(() => {
    localStorage.setItem('home-hub-dim-mode', dimMode);
  }, [dimMode]);

  // Calculate Dim State
  useEffect(() => {
    const updateDimState = () => {
      if (dimMode === 'auto') {
        const hour = new Date().getHours();
        const shouldDim = hour >= 21 || hour < 6;
        setIsDimmed(shouldDim);
      } else {
        setIsDimmed(dimMode === 'dark');
      }
    };

    updateDimState();
    const interval = setInterval(updateDimState, 60000);
    return () => clearInterval(interval);
  }, [dimMode]);

  // Apply Dim Class
  useEffect(() => {
    document.body.classList.toggle('night-dim', isDimmed);
  }, [isDimmed]);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden p-2 lg:p-10 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <Navigation
        slides={SLIDE_TITLES}
        activeIndex={activeSlide}
        onNavigate={setActiveSlide}
      />

      <div className="fixed top-8 right-8 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20">
        <button
          onClick={() => setDimMode('light')}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${dimMode === 'light' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
        >
          Light
        </button>
        <button
          onClick={() => setDimMode('auto')}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${dimMode === 'auto' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
        >
          Auto
        </button>
        <button
          onClick={() => setDimMode('dark')}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${dimMode === 'dark' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
        >
          Dark
        </button>
      </div>

      <div className="relative w-full h-full pt-20 lg:pt-24 pb-12 lg:pb-0">
        <Slide isActive={activeSlide === 0} title="Family Calendar">
          <div className="w-full h-full min-h-[400px] lg:min-h-0">
            <CalendarDataView
              icalUrl={ICAL_URL}
            />
          </div>
        </Slide>

        <Slide isActive={activeSlide === 1} title="Today's Hub">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-7 h-full min-h-0">
            {/* Left Column: Clock & Weather */}
            <div className="lg:col-span-4 flex flex-col gap-3 lg:gap-7 h-full min-h-0">
              <div className="flex-shrink-0">
                <Clock />
              </div>
              <div className="flex-1 min-h-0">
                <Weather />
              </div>
            </div>

            {/* Right Column: Main Content */}
            <div className="lg:col-span-8 flex flex-col gap-3 lg:gap-7 h-full min-h-0">
              {/* Top Row: Focus */}
              <div className="flex-shrink-0">
                <FocusWidget />
              </div>

              {/* Bottom Row: Widgets Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-7 min-h-0 pb-16 lg:pb-0">
                <div className="h-[180px] lg:h-full">
                  <ProjectWidget />
                </div>
                <div className="h-[220px] lg:h-full">
                  <CalendarWidget icalUrl={ICAL_URL} />
                </div>
                <div className="h-[180px] lg:h-full overflow-hidden">
                  <NotesWidget />
                </div>
              </div>
            </div>
          </div>
        </Slide>

        <Slide isActive={activeSlide === 2} title="Our Projects">
          <div className="w-full h-full">
            <ProjectBoard />
          </div>
        </Slide>

        <Slide isActive={activeSlide === 3} title="Family Notes">
          <div className="w-full h-full">
            <NoteBoard />
          </div>
        </Slide>

        <Slide isActive={activeSlide === 4} title="Shopping List">
          <div className="w-full h-full">
            <ShoppingList />
          </div>
        </Slide>

        <Slide isActive={activeSlide === 5} title="Vehicle Maintenance Data">
          <div className="w-full h-full">
            <GoogleSheetDataView
              csvUrl="https://docs.google.com/spreadsheets/d/e/2PACX-1vRBE-u5ylx0OV8t5uWwOsEta08lbGvaKMLjYj3z0gwHy2kEWkiNU9dM0n-U8aTyQei5CX6fE4g95-aE/pub?output=csv"
            />
          </div>
        </Slide>
      </div>

      {/* Voice Assistant */}
      <VoiceCommander />

      {/* Pause Indicator */}
      {/* Pause Indicator Removed as per request */}
    </main>
  );
}
