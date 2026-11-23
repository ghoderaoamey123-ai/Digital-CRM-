import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, MessageCircle, Phone, Play, Presentation } from 'lucide-react';

interface TutorialsPageProps {
  onClose: () => void;
  onOpenOnboarding: (slide?: number) => void;
}

const TUTORIAL_CARDS = [
  {
    id: 't1',
    category: 'Live Call',
    title: 'Live Call Sharing',
    desc: 'Client se baat karte waqt turant WhatsApp par property details aur Google Maps link bhejein.',
    steps: ['Tap Call on any lead card', 'Choose WhatsApp Share', 'Select Property + Unit Variant and send'],
  },
  {
    id: 't2',
    category: 'Workflow',
    title: 'After Call Flow',
    desc: 'Call cut hone ke baad agla step set karein — Follow-up, Reschedule, Site Visit, ya NPU.',
    steps: ['Confirm if client talked', 'Pick next funnel stage & date/time', 'Record Today Talk & Next Pointers'],
  },
  {
    id: 't3',
    category: 'WhatsApp',
    title: 'Multiple Property Sharing',
    desc: 'Ek sath kai properties select karke single formatted WhatsApp catalog share karein.',
    steps: ['Open Property tab & tap Select', 'Pick 2–5 properties', 'Tap Share All on WhatsApp'],
  },
  {
    id: 't4',
    category: 'Planning',
    title: 'Calendar Benefit',
    desc: 'Calendar dots (Follow-up, Reschedule, Site Visit) dekhkar aane wale din plan karein.',
    steps: ['Tap the top Date pill', 'Inspect color-coded dots per date', 'Jump to any past or future day'],
  },
  {
    id: 't5',
    category: 'Inventory',
    title: 'Smart Paste Auto-Fill',
    desc: 'WhatsApp broker group ka message paste karein — BHK, sqft, rate, aur location automatic fill hoga.',
    steps: ['Open Add Property', 'Tap Smart Paste pill in header', 'Paste message & tap Auto Fill'],
  },
  {
    id: 't6',
    category: 'Network',
    title: 'Requirement Auto-Match',
    desc: 'Client requirement dalte hi aapki aur partner brokers ki matching properties turant dikhti hain.',
    steps: ['Open Network → Requirements', 'Add client budget & area', 'Review Strong/Good match scores'],
  },
];

export const TutorialsPage: React.FC<TutorialsPageProps> = ({
  onClose,
  onOpenOnboarding,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>('t1');

  return (
    <div className="min-h-screen pb-32 max-w-4xl mx-auto">
      <header className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-xl px-4 py-3 border-b border-[var(--sep2)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl font-extrabold tracking-tight">
            Guides &amp; Tutorials
          </h1>
        </div>

        <button
          type="button"
          onClick={() => onOpenOnboarding(1)}
          className="px-3.5 py-1.5 rounded-full bg-[#101C35]/10 text-[#101C35] dark:bg-[#27C6A0]/15 dark:text-[#27C6A0] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Presentation className="w-3.5 h-3.5" />
          View Slides
        </button>
      </header>

      <div className="px-4 pt-5 space-y-6">
        {/* Talk to Manager Contact Card */}
        <div className="bg-[var(--card)] border border-[var(--sep2)] rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 pt-4 text-[11px] font-bold uppercase tracking-wider text-[var(--label3)]">
            Need Help?
          </div>
          <div className="flex flex-col items-center text-center px-5 py-4">
            <div className="w-18 h-18 rounded-full bg-gradient-to-br from-[#101C35] to-[#27C6A0] text-white text-2xl font-black flex items-center justify-center shadow-lg shadow-[#101C35]/25 mb-3">
              RS
            </div>
            <div className="font-display text-xl font-extrabold">Rajdeep Singh Sisodia</div>
            <div className="text-xs font-bold text-[#27C6A0] mt-0.5">Manager · Digital CRM</div>
            <p className="text-xs text-[var(--label3)] mt-2 max-w-xs">
              For onboarding help, broker verification, or feedback, call or message directly.
            </p>
          </div>

          <div className="flex items-center justify-center gap-7 pb-5">
            <a href="tel:7000102910" className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-[#101C35] text-white flex items-center justify-center shadow-md">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-[var(--label2)]">Call</span>
            </a>
            <a
              href="https://wa.me/917000102910"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-12 h-12 rounded-full bg-[#27C6A0] text-[#101C35] flex items-center justify-center shadow-md">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-[var(--label2)]">WhatsApp</span>
            </a>
          </div>

          <div className="px-4 pb-4">
            <a
              href="https://chat.whatsapp.com/BL4QvhWFTseAZTaaat516u?mode=gi_t"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 p-4 rounded-2xl text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #101C35 0%, #27C6A0 100%)' }}
            >
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/85">
                  Join Now
                </div>
                <div className="font-display text-base font-extrabold">Digital CRM Updates Group</div>
                <div className="text-xs text-white/85">Latest updates, tips &amp; new features</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </a>
          </div>
        </div>

        {/* Interactive Walkthrough Guides Grid */}
        <div>
          <h2 className="font-display text-lg font-extrabold mb-3">Workflow Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TUTORIAL_CARDS.map((card) => {
              const isOpen = expandedId === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => setExpandedId(isOpen ? null : card.id)}
                  className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#27C6A0]">
                        {card.category}
                      </div>
                      <h3 className="font-display text-base font-extrabold mt-0.5">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[var(--label3)] mt-1 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-[#101C35]/10 text-[#101C35] dark:bg-[#27C6A0]/15 dark:text-[#27C6A0] flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4" />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-[var(--sep2)] space-y-1.5">
                      {card.steps.map((s, idx) => (
                        <div key={s} className="text-xs font-semibold text-[var(--label2)]">
                          0{idx + 1}. {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
