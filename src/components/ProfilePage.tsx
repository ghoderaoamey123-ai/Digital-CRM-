import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Compass,
  Download,
  LogOut,
  Moon,
  Presentation,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import type { BrokerProfile, Deal, Lead, Property } from '../types/crm';
import { formatBrokerId, formatINR, getGreetingByTime } from '../utils/crmHelpers';

interface ProfilePageProps {
  profile: BrokerProfile;
  leads: Lead[];
  properties: Property[];
  deals: Deal[];
  fontSizeStep: number;
  darkMode: boolean;
  onSetFontSizeStep: (step: number) => void;
  onToggleDarkMode: () => void;
  onUpdateProfile: (patch: Partial<BrokerProfile>) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onOpenTrash: () => void;
  onOpenOnboarding: (slide?: number) => void;
  onOpenTour: () => void;
  onClose: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  leads,
  properties,
  deals,
  fontSizeStep,
  darkMode,
  onSetFontSizeStep,
  onToggleDarkMode,
  onUpdateProfile,
  onExportBackup,
  onImportBackup,
  onOpenTrash,
  onOpenOnboarding,
  onOpenTour,
  onClose,
}) => {
  const [showTextSlider, setShowTextSlider] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editGreeting, setEditGreeting] = useState(profile.greeting);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const earned = useMemo(
    () => deals.filter((d) => d.stage === 'full').reduce((s, d) => s + (d.commAmount || 0), 0),
    [deals]
  );
  const potential = useMemo(
    () =>
      deals
        .filter((d) => d.stage !== 'full' && !d.isLeakage)
        .reduce((s, d) => s + (d.commAmount || 0), 0),
    [deals]
  );

  const activeLeadsCount = leads.filter((l) => l.type !== 'trash').length;
  const trashCount = leads.filter((l) => l.type === 'trash').length;

  const handleSave = () => {
    const parts = editName.trim().split(/\s+/);
    onUpdateProfile({
      name: editName.trim() || profile.name,
      firstName: parts[0] || profile.firstName,
      lastName: parts.slice(1).join(' ') || profile.lastName,
      phone: editPhone.trim() || profile.phone,
      greeting: editGreeting.trim() || '__time__',
    });
    setEditing(false);
  };

  return (
    <div className="min-h-screen pb-32 max-w-3xl mx-auto">
      {/* Header */}
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
          <h1 className="font-display text-xl font-extrabold tracking-tight">Profile</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDarkMode}
            title="Toggle Light / Dark"
            className="w-9 h-9 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-[#ff9500]" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setShowTextSlider((s) => !s)}
            className="px-3 py-1.5 rounded-full bg-[var(--fill2)] text-xs font-extrabold cursor-pointer"
          >
            A A
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Text Size Panel */}
        {showTextSlider && (
          <div className="rounded-2xl p-4 bg-[#101C35] text-white border border-white/15 shadow-lg animate-sheet-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                Text Size
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#27C6A0] text-[#101C35] text-xs font-extrabold tabular-nums">
                Size {fontSizeStep} / 9
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold">A</span>
              <input
                type="range"
                min={1}
                max={9}
                step={1}
                value={fontSizeStep}
                onChange={(e) => onSetFontSizeStep(Number(e.target.value))}
                className="flex-1 accent-[#27C6A0]"
              />
              <span className="text-xl font-extrabold">A</span>
            </div>
          </div>
        )}

        {/* Dark Broker Identity Card */}
        <div
          className="rounded-3xl p-5 text-white shadow-xl border border-white/10"
          style={{
            background: 'linear-gradient(155deg, #101C35 0%, #0b1427 100%)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#101C35] to-[#27C6A0] border border-white/25 flex items-center justify-center text-xl font-black shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-display text-xl font-extrabold truncate">{profile.name}</div>
                <div className="text-xs text-white/70 tabular-nums mt-0.5">{profile.phone}</div>
                <div className="font-mono-id text-[11px] text-white/45 mt-1">
                  {formatBrokerId(profile.id)} · Real Estate Broker ({profile.city})
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              className="px-3.5 py-1.5 rounded-full bg-white/12 hover:bg-white/20 text-xs font-bold cursor-pointer shrink-0"
            >
              {editing ? 'Close' : 'Edit'}
            </button>
          </div>

          <div className="mt-4 pt-3.5 border-t border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
              WhatsApp Greeting
            </div>
            <div className="text-sm font-bold mt-1">
              {profile.greeting === '__time__' ? 'Good morning / evening (Auto)' : profile.greeting}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between gap-3">
            {profile.isSignedIn ? (
              <>
                <span className="text-xs font-semibold text-white/80 truncate">
                  {profile.email || 'Signed in with Google'}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateProfile({ isSignedIn: false })}
                  title="Logout"
                  className="w-9 h-9 rounded-full bg-[#ff3b30]/20 text-[#ff6961] flex items-center justify-center cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onUpdateProfile({ isSignedIn: true })}
                className="w-full py-3 rounded-xl bg-white text-[#202B3C] text-xs font-extrabold cursor-pointer"
              >
                Continue with Google
              </button>
            )}
          </div>
        </div>

        {/* Inline Edit Profile Form */}
        {editing && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] p-4 space-y-3 animate-sheet-up">
            <div>
              <label className="text-xs font-bold text-[var(--label3)]">Your Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-[var(--fill3)] text-sm font-semibold outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--label3)]">Your Number</label>
              <input
                value={editPhone}
                maxLength={10}
                onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-[var(--fill3)] text-sm font-semibold tabular-nums outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--label3)]">WA Greeting</label>
              <input
                value={editGreeting}
                onChange={(e) => setEditGreeting(e.target.value)}
                placeholder="__time__ or Namaste 🙏"
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-[var(--fill3)] text-sm font-semibold outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--fill2)] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-[2] py-2.5 rounded-xl bg-[#101C35] text-white text-xs font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Earnings & CRM Snapshot */}
        <div className="bg-[var(--card)] rounded-3xl border border-[var(--sep2)] p-5 space-y-4 shadow-xs">
          <div>
            <div className="text-xs font-bold text-[var(--label3)]">
              {getGreetingByTime()}, {profile.name.split(' ')[0]}
            </div>
            <h2 className="font-display text-lg font-extrabold mt-0.5">Earnings &amp; Pipeline</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-[#27C6A0]/15">
              <div className="text-[11px] font-bold text-[#101C35] dark:text-[#27C6A0]">Earned</div>
              <div className="text-lg font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums mt-0.5">
                {formatINR(earned)}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#101C35]/8 dark:bg-white/10">
              <div className="text-[11px] font-bold text-[#101C35] dark:text-[#27C6A0]">Pipeline</div>
              <div className="text-lg font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums mt-0.5">
                {formatINR(potential)}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--fill3)]">
              <div className="text-[11px] font-bold text-[var(--label3)]">Active Leads</div>
              <div className="text-lg font-black tabular-nums mt-0.5">{activeLeadsCount}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--fill3)]">
              <div className="text-[11px] font-bold text-[var(--label3)]">Properties</div>
              <div className="text-lg font-black tabular-nums mt-0.5">{properties.length}</div>
            </div>
          </div>
        </div>

        {/* Slides & Guided Tour Replay */}
        <div className="bg-[var(--card)] rounded-3xl border border-[var(--sep2)] p-5 space-y-3 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--label3)]">
            Onboarding Slides &amp; Tour
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onOpenOnboarding(1)}
              className="py-3 px-4 rounded-2xl bg-[#101C35]/10 text-[#101C35] dark:bg-white/10 dark:text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Presentation className="w-4 h-4" />
              Replay 8 Onboarding Slides
            </button>
            <button
              type="button"
              onClick={onOpenTour}
              className="py-3 px-4 rounded-2xl bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Start Spotlight Tour
            </button>
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="bg-[var(--card)] rounded-3xl border border-[var(--sep2)] p-5 space-y-3 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--label3)]">
            Data Backup
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onExportBackup}
              className="py-3.5 rounded-2xl bg-[#101C35] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#101C35]/25 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Backup Data
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="py-3.5 rounded-2xl bg-[#27C6A0]/15 border border-[#27C6A0]/40 text-[#101C35] dark:text-[#27C6A0] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Restore Data
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportBackup(f);
              }}
            />
          </div>
          <div className="text-[11px] text-[var(--label3)] text-center font-medium">
            Export JSON before migrating to a new device
          </div>
        </div>

        {/* Trash Button */}
        <button
          type="button"
          onClick={onOpenTrash}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-[#b00020] to-[#8b0000] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Trash &amp; Leakage ({trashCount})
        </button>
      </div>
    </div>
  );
};
