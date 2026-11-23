import React, { useState } from 'react';
import { Calendar, GitBranch, Home, MapPin, Network, Phone, RotateCcw } from 'lucide-react';
import type { MainTabFilter } from '../types/crm';

interface BottomNavBarProps {
  activeView: 'today' | 'pipeline' | 'props' | 'network';
  pipelineCount: number;
  onSelectToday: () => void;
  onQuickFilterFromCall: (filter: MainTabFilter) => void;
  onOpenPipeline: () => void;
  onOpenProps: () => void;
  onOpenNetwork: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeView,
  pipelineCount,
  onSelectToday,
  onQuickFilterFromCall,
  onOpenPipeline,
  onOpenProps,
  onOpenNetwork,
}) => {
  const [callPopupOpen, setCallPopupOpen] = useState(false);

  return (
    <>
      {callPopupOpen && (
        <div
          onClick={() => setCallPopupOpen(false)}
          className="fixed inset-0 z-40"
        />
      )}

      {callPopupOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[var(--card)] border border-[var(--sep2)] rounded-2xl shadow-2xl p-2 min-w-[210px] animate-sheet-up">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--label3)] px-3 py-1.5">
            Call Actions
          </div>
          <button
            type="button"
            onClick={() => {
              setCallPopupOpen(false);
              onQuickFilterFromCall('follow');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--fill3)] text-sm font-semibold text-left cursor-pointer"
          >
            <Phone className="w-4 h-4 text-[#101C35]" />
            <span>Follow-up</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCallPopupOpen(false);
              onQuickFilterFromCall('reschedule');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--fill3)] text-sm font-semibold text-left cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#ff9500]" />
            <span>Reschedule</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCallPopupOpen(false);
              onQuickFilterFromCall('visit');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--fill3)] text-sm font-semibold text-left cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-[#27C6A0]" />
            <span>Site Visit</span>
          </button>
        </div>
      )}

      {/* Dual-Island Floating Bottom Tab Bar */}
      <nav
        aria-label="Primary Navigation"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-3 max-w-full"
      >
        {/* Left Island: Today | Call | Pipeline */}
        <div className="flex items-center gap-1 p-1.5 rounded-full bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--sep2)] shadow-xl">
          <button
            type="button"
            onClick={onSelectToday}
            className={`px-3.5 py-2 rounded-full flex flex-col items-center justify-center min-w-[64px] transition-colors cursor-pointer ${
              activeView === 'today'
                ? 'bg-[#101C35] text-white'
                : 'text-[var(--label3)] hover:text-[var(--label)]'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap">Today</span>
          </button>

          <button
            type="button"
            onClick={() => setCallPopupOpen((o) => !o)}
            className={`px-3.5 py-2 rounded-full flex flex-col items-center justify-center min-w-[60px] transition-colors cursor-pointer ${
              callPopupOpen
                ? 'bg-[#101C35] text-white'
                : 'text-[var(--label3)] hover:text-[var(--label)]'
            }`}
          >
            <Phone className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap">Call</span>
          </button>

          <button
            type="button"
            onClick={onOpenPipeline}
            className={`relative px-3.5 py-2 rounded-full flex flex-col items-center justify-center min-w-[66px] transition-colors cursor-pointer ${
              activeView === 'pipeline'
                ? 'bg-[#101C35] text-white'
                : 'text-[var(--label3)] hover:text-[var(--label)]'
            }`}
          >
            <GitBranch className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap">Pipeline</span>
            <span className="absolute top-1 right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#27C6A0] text-[#101C35] text-[9px] font-extrabold flex items-center justify-center tabular-nums">
              {pipelineCount}
            </span>
          </button>
        </div>

        {/* Right Island: Property | Network */}
        <div className="flex items-center gap-1 p-1.5 rounded-full bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--sep2)] shadow-xl">
          <button
            type="button"
            onClick={onOpenProps}
            className={`px-3.5 py-2 rounded-full flex flex-col items-center justify-center min-w-[66px] transition-colors cursor-pointer ${
              activeView === 'props'
                ? 'bg-[#101C35] text-white'
                : 'text-[var(--label3)] hover:text-[var(--label)]'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap">Property</span>
          </button>

          <button
            type="button"
            onClick={onOpenNetwork}
            className={`px-3.5 py-2 rounded-full flex flex-col items-center justify-center min-w-[66px] transition-colors cursor-pointer ${
              activeView === 'network'
                ? 'bg-[#101C35] text-white'
                : 'text-[var(--label3)] hover:text-[var(--label)]'
            }`}
          >
            <Network className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap">Network</span>
          </button>
        </div>
      </nav>
    </>
  );
};
