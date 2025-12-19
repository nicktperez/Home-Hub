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
  const [autoDimEnabled, setAutoDimEnabled] = useState(true);
  const [isDimmed, setIsDimmed] = useState(false);

  useEffect(() => {
    if (paused) return;

    const duration = SLIDE_DURATIONS[activeSlide] || 20000;
    const timer = setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDE_TITLES.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [activeSlide, paused]);

  useEffect(() => {
    const saved = localStorage.getItem('home-hub-auto-dim');
    if (saved !== null) {
      setAutoDimEnabled(saved === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('home-hub-auto-dim', String(autoDimEnabled));
  }, [autoDimEnabled]);

  useEffect(() => {
    const updateDimState = () => {
      const hour = new Date().getHours();
      const shouldDim = autoDimEnabled && (hour >= 21 || hour < 6);
      setIsDimmed(shouldDim);
    };

    updateDimState();
    const interval = setInterval(updateDimState, 60000);
    return () => clearInterval(interval);
  }, [autoDimEnabled]);

  useEffect(() => {
    document.body.classList.toggle('night-dim', isDimmed);
  }, [isDimmed]);

  return (
    <main className="relative w-screen h-screen overflow-hidden p-6 lg:p-10 select-none">
      <Navigation
        slides={SLIDE_TITLES}
        activeIndex={activeSlide}
        onNavigate={setActiveSlide}
      />

      <div className="fixed top-8 right-8 z-50 flex items-center gap-3">
        <button
          onClick={() => setAutoDimEnabled((prev) => !prev)}
          className="glass-card px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-cocoa/70 hover:text-cocoa transition-colors border border-white/60"
        >
          Auto Dim: {autoDimEnabled ? 'On' : 'Off'}
        </button>
        {isDimmed && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose bg-rose/10 px-3 py-2 rounded-full border border-rose/20">
            Dimmed
          </span>
        )}
      </div>

      <div className="relative w-full h-full pt-16 lg:pt-20">
        <Slide isActive={activeSlide === 0} title="Family Calendar">
          <div className="w-full h-full">
            <CalendarDataView
              icalUrl={ICAL_URL}
            />
          </div>
        </Slide>

        <Slide isActive={activeSlide === 1} title="Today's Hub">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 h-full min-h-0">
            {/* Left Column: Clock & Weather */}
            <div className="lg:col-span-4 flex flex-col gap-5 lg:gap-7 h-full min-h-0">
              <div className="flex-shrink-0">
                <Clock />
              </div>
              <div className="flex-1 min-h-0">
                <Weather />
              </div>
            </div>

            {/* Right Column: Main Content */}
            <div className="lg:col-span-8 flex flex-col gap-5 lg:gap-7 h-full min-h-0">
              {/* Top Row: Focus */}
              <div className="flex-shrink-0">
                <FocusWidget />
              </div>

              {/* Bottom Row: Widgets Grid */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7 min-h-0">
                <div className="h-full min-h-0">
                  <ProjectWidget />
                </div>
                <div className="h-full min-h-0">
                  <CalendarWidget icalUrl={ICAL_URL} />
                </div>
                <div className="h-full min-h-0">
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

      {/* Pause Indicator */}
      {paused && (
        <div className="fixed bottom-8 right-8 bg-rose text-white text-[10px] font-bold tracking-widest px-4 py-2 rounded-full shadow-lg">
          PAUSED
        </div>
      )}
    </main>
  );
}
