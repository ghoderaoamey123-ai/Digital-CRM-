import React, { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

interface SpotlightTourProps {
  onClose: () => void;
  onNavigateTarget: (target: 'today' | 'props' | 'network' | 'pipeline') => void;
}

const TOUR_STEPS: {
  badge: string;
  title: string;
  text: string;
  target: 'today' | 'props' | 'network' | 'pipeline';
  tip: string;
}[] = [
  {
    badge: 'Step 1 of 4',
    title: 'Today Funnel & Overdue Tracking',
    text: 'Every Site Visit, Follow-up, Reschedule, and Unattended lead appears in one prioritized workspace so zero leads slip away.',
    target: 'today',
    tip: 'Tap any stat card at the top to filter instantly.',
  },
  {
    badge: 'Step 2 of 4',
    title: 'Smart Paste Property Inventory',
    text: 'Paste any messy WhatsApp broker message into Smart Paste and Digital CRM extracts BHK, sqft, rate, price, and location automatically.',
    target: 'props',
    tip: 'Use natural language search like "3BHK flat under 65L".',
  },
  {
    badge: 'Step 3 of 4',
    title: '8-Page Broker Network',
    text: 'Connect with verified city brokers, share selective inventory, view Partner Properties, and auto-match client requirements.',
    target: 'network',
    tip: 'Includes Rate Calculator, Unit Converter & Loan EMI tools.',
  },
  {
    badge: 'Step 4 of 4',
    title: 'Deal Pipeline & Commission',
    text: 'Track SV Done negotiations, Token bayana installments, and Final Deals with automatic ₹ brokerage calculations.',
    target: 'pipeline',
    tip: 'Tap Pipeline in the bottom bar anytime.',
  },
];

export const SpotlightTour: React.FC<SpotlightTourProps> = ({ onClose, onNavigateTarget }) => {
  const [idx, setIdx] = useState(0);
  const step = TOUR_STEPS[idx];

  const handleNext = () => {
    if (idx < TOUR_STEPS.length - 1) {
      setIdx((i) => i + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-3xl bg-[#101C35] text-white border border-white/15 p-6 shadow-2xl animate-sheet-up">
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full bg-[#27C6A0]/20 text-[#27C6A0] text-xs font-bold">
            {step.badge}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tour"
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-display text-2xl font-extrabold tracking-tight mb-2">{step.title}</h3>
        <p className="text-sm text-white/75 leading-relaxed mb-4">{step.text}</p>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-xs text-white/80 mb-6">
          {step.tip}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onNavigateTarget(step.target);
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
          >
            Open This Screen
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-[#27C6A0] hover:bg-[#22b390] text-[#101C35] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            {idx < TOUR_STEPS.length - 1 ? 'Next Step' : 'Finish Tour'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
