import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type {
  BrokerProfile,
  Lead,
  LeadType,
  NotificationItem,
  Property,
} from '../types/crm';
import {
  buildWhatsAppPreviewMessage,
  formatINR,
  getLeadActiveDate,
  todayStr,
} from '../utils/crmHelpers';

/* ── 1. LEAD ADD / EDIT MODAL ── */
export const LeadEditModal: React.FC<{
  lead: Lead | null;
  defaultDate: string;
  properties: Property[];
  onSave: (data: Omit<Lead, 'id' | 'createdAt'>, existingId?: string) => void;
  onClose: () => void;
}> = ({ lead, defaultDate, properties, onSave, onClose }) => {
  const [name, setName] = useState(lead?.name || '');
  const [phone, setPhone] = useState(lead?.phone || '');
  const [nickname, setNickname] = useState(lead?.nickname || '');
  const [leadDate, setLeadDate] = useState(lead?.leadDate || defaultDate);
  const [type, setType] = useState<LeadType>(lead?.type || 'new');
  const [propertyId, setPropertyId] = useState(lead?.propertyId || '');
  const [variantLabel, setVariantLabel] = useState(lead?.variantLabel || '');
  const [budget, setBudget] = useState(lead?.budget || '');
  const [todayTalk, setTodayTalk] = useState(lead?.todayTalk || '');
  const [nextPts, setNextPts] = useState(lead?.nextPts || '');
  const [timeVal, setTimeVal] = useState(
    lead?.visitTime || lead?.followTime || lead?.reschedTime || ''
  );

  const selProp = properties.find((p) => p.id === propertyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(
      {
        name: name.trim(),
        phone: phone.trim(),
        nickname: nickname.trim() || undefined,
        leadDate,
        type,
        propertyId: propertyId || undefined,
        variantLabel: variantLabel || undefined,
        budget: budget.trim() || undefined,
        todayTalk: todayTalk.trim() || undefined,
        nextPts: nextPts.trim() || undefined,
        nextFollowup: type === 'follow' ? leadDate : lead?.nextFollowup,
        followTime: type === 'follow' ? timeVal : lead?.followTime,
        visitDate: type === 'visit' ? leadDate : lead?.visitDate,
        visitTime: type === 'visit' ? timeVal : lead?.visitTime,
        reschedDate: type === 'reschedule' ? leadDate : lead?.reschedDate,
        reschedTime: type === 'reschedule' ? timeVal : lead?.reschedTime,
        isRequirementLead: type === 'requirement',
        callsCount: lead?.callsCount || 0,
        waCount: lead?.waCount || 0,
      },
      lead?.id
    );
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-[var(--bg)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto space-y-4 animate-sheet-up"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold">
            {lead ? 'Edit Lead' : 'New Lead'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] divide-y divide-[var(--sep2)]">
          <div className="flex items-center justify-between px-4 py-3 gap-2">
            <label className="text-xs font-bold text-[var(--label3)]">Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client name"
              className="text-right text-sm font-semibold bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3 gap-2">
            <label className="text-xs font-bold text-[var(--label3)]">Phone</label>
            <input
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit number"
              className="text-right text-sm font-semibold bg-transparent outline-none tabular-nums"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3 gap-2">
            <label className="text-xs font-bold text-[var(--label3)]">WhatsApp Nick</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Bhai, Sir, Ji"
              className="text-right text-sm font-semibold text-[#27C6A0] bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3 gap-2">
            <label className="text-xs font-bold text-[var(--label3)]">Date</label>
            <input
              type="date"
              value={leadDate}
              onChange={(e) => setLeadDate(e.target.value)}
              className="text-right text-sm font-semibold bg-transparent outline-none"
            />
          </div>
          {(type === 'follow' || type === 'visit' || type === 'reschedule') && (
            <div className="flex items-center justify-between px-4 py-3 gap-2">
              <label className="text-xs font-bold text-[var(--label3)]">Time</label>
              <input
                type="time"
                value={timeVal}
                onChange={(e) => setTimeVal(e.target.value)}
                className="text-right text-sm font-semibold bg-transparent outline-none"
              />
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--label3)] mb-2">
            Lead Type
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { k: 'new', l: 'New Lead' },
                { k: 'follow', l: 'Follow-up' },
                { k: 'visit', l: 'Site Visit' },
                { k: 'reschedule', l: 'Reschedule' },
                { k: 'requirement', l: 'Requirement' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.k}
                type="button"
                onClick={() => setType(opt.k)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  type === opt.k
                    ? opt.k === 'requirement'
                      ? 'bg-[#27C6A0] text-[#101C35]'
                      : 'bg-[#101C35] text-white'
                    : 'bg-[var(--card)] border border-[var(--sep2)] text-[var(--label2)]'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] divide-y divide-[var(--sep2)]">
          <div className="flex items-center justify-between px-4 py-3 gap-2">
            <label className="text-xs font-bold text-[var(--label3)]">Property</label>
            <select
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setVariantLabel('');
              }}
              className="text-right text-xs font-bold bg-transparent outline-none"
            >
              <option value="">None / Not selected</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between px-4 py-3 gap-2">
            <label className="text-xs font-bold text-[var(--label3)]">Budget</label>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 50-60 Lakhs"
              className="text-right text-sm font-semibold bg-transparent outline-none"
            />
          </div>
        </div>

        {selProp && selProp.variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selProp.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantLabel(v.label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  variantLabel === v.label
                    ? 'bg-[#101C35] text-white'
                    : 'bg-[var(--card)] border border-[var(--sep2)]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <textarea
          rows={2}
          value={todayTalk}
          onChange={(e) => setTodayTalk(e.target.value)}
          placeholder="Summary of today's conversation..."
          className="w-full p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--sep2)] text-xs outline-none"
        />
        <textarea
          rows={2}
          value={nextPts}
          onChange={(e) => setNextPts(e.target.value)}
          placeholder="Next call pointers..."
          className="w-full p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--sep2)] text-xs outline-none"
        />

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-[#101C35] text-white font-extrabold text-sm cursor-pointer"
        >
          {lead ? 'Save Changes' : 'Save Lead'}
        </button>
      </form>
    </div>
  );
};

/* ── 2. POST-CALL WORKFLOW MODAL ── */
export const PostCallModal: React.FC<{
  lead: Lead;
  properties: Property[];
  onUpdateLead: (id: string, patch: Partial<Lead>) => void;
  onClose: () => void;
}> = ({ lead, properties, onUpdateLead, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [nextType, setNextType] = useState<LeadType>('follow');
  const [nextDate, setNextDate] = useState(todayStr());
  const [nextTime, setNextTime] = useState('11:00');
  const [talk, setTalk] = useState(lead.todayTalk || '');
  const [pts, setPts] = useState(lead.nextPts || '');
  const [propId, setPropId] = useState(lead.propertyId || '');

  const handleSave = () => {
    onUpdateLead(lead.id, {
      type: nextType,
      leadDate: nextDate,
      nextFollowup: nextType === 'follow' ? nextDate : lead.nextFollowup,
      followTime: nextType === 'follow' ? nextTime : lead.followTime,
      visitDate: nextType === 'visit' ? nextDate : lead.visitDate,
      visitTime: nextType === 'visit' ? nextTime : lead.visitTime,
      reschedDate: nextType === 'reschedule' ? nextDate : lead.reschedDate,
      reschedTime: nextType === 'reschedule' ? nextTime : lead.reschedTime,
      todayTalk: talk,
      nextPts: pts,
      propertyId: propId || undefined,
      callsCount: (lead.callsCount || 0) + 1,
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[var(--bg)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4 animate-sheet-up"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-extrabold">
              {step === 1 ? `Call with ${lead.name}` : `Move ${lead.name}`}
            </h3>
            <div className="text-xs font-semibold text-[var(--label3)] tabular-nums">
              {lead.phone}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-2.5">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="w-full py-3 rounded-2xl bg-[#101C35]/10 text-[#101C35] dark:bg-[#27C6A0]/15 dark:text-[#27C6A0] text-sm font-extrabold flex items-center justify-center gap-2"
              >
                Dial {lead.phone} Now
              </a>
            )}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-2xl bg-[#27C6A0] text-[#101C35] text-sm font-extrabold cursor-pointer"
            >
              Yes, We Talked → Update Next Step
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateLead(lead.id, {
                  type: 'npu',
                  callsCount: (lead.callsCount || 0) + 1,
                });
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-[#ff9500]/15 text-[#ff9500] text-sm font-bold cursor-pointer"
            >
              Not Picked Up (Move to NPU)
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateLead(lead.id, { type: 'trash' });
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-[#ff3b30]/12 text-[#ff3b30] text-sm font-bold cursor-pointer"
            >
              Wrong / Not Interested (Trash)
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { k: 'follow', l: 'Follow-up' },
                  { k: 'reschedule', l: 'Reschedule' },
                  { k: 'visit', l: 'Site Visit' },
                  { k: 'requirement', l: 'Requirement' },
                  { k: 'npu', l: 'Not Picked' },
                  { k: 'trash', l: 'Trash' },
                ] as const
              ).map((m) => (
                <button
                  key={m.k}
                  type="button"
                  onClick={() => setNextType(m.k)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold cursor-pointer ${
                    nextType === m.k
                      ? 'bg-[#101C35] text-white'
                      : 'bg-[var(--card)] border border-[var(--sep2)]'
                  }`}
                >
                  {m.l}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-bold outline-none"
              />
              <input
                type="time"
                value={nextTime}
                onChange={(e) => setNextTime(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-bold outline-none"
              />
            </div>

            <select
              value={propId}
              onChange={(e) => setPropId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-bold outline-none"
            >
              <option value="">Property discussed (optional)</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <textarea
              rows={2}
              value={talk}
              onChange={(e) => setTalk(e.target.value)}
              placeholder="Today's talk summary..."
              className="w-full p-3 rounded-2xl bg-[var(--card)] border border-[var(--sep2)] text-xs outline-none"
            />
            <textarea
              rows={2}
              value={pts}
              onChange={(e) => setPts(e.target.value)}
              placeholder="Next call pointers..."
              className="w-full p-3 rounded-2xl bg-[var(--card)] border border-[var(--sep2)] text-xs outline-none"
            />

            <button
              type="button"
              onClick={handleSave}
              className="w-full py-3.5 rounded-2xl bg-[#101C35] text-white font-extrabold text-sm cursor-pointer"
            >
              Save Call Update
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── 3. WHATSAPP SHARE COMPOSER MODAL ── */
export const WhatsAppModal: React.FC<{
  profile: BrokerProfile;
  lead?: Lead | null;
  properties: Property[];
  initialProperty?: Property | null;
  initialVariant?: string;
  batchProps?: Property[];
  onSent: (leadId?: string) => void;
  onClose: () => void;
}> = ({
  profile,
  lead,
  properties,
  initialProperty,
  initialVariant,
  batchProps,
  onSent,
  onClose,
}) => {
  const [selectedPropId, setSelectedPropId] = useState(
    initialProperty?.id || lead?.propertyId || properties[0]?.id || ''
  );
  const [variantLabel, setVariantLabel] = useState(initialVariant || lead?.variantLabel || '');
  const [includeMap, setIncludeMap] = useState(true);
  const [copied, setCopied] = useState(false);

  const selectedProp = properties.find((p) => p.id === selectedPropId) || initialProperty;

  const message = useMemo(() => {
    if (batchProps && batchProps.length > 0) {
      return batchProps
        .map((p, idx) =>
          `${idx + 1}. *${p.name}* (${p.location}) — ${formatINR(p.price)}`
        )
        .join('\n');
    }
    return buildWhatsAppPreviewMessage({
      greeting: profile.greeting,
      brokerName: profile.name,
      phone: profile.phone,
      clientNickname: lead?.nickname || lead?.name?.split(' ')[0],
      property: selectedProp || undefined,
      variantLabel,
      includeMap,
    });
  }, [batchProps, profile, lead, selectedProp, variantLabel, includeMap]);

  const waUrl = `https://wa.me/${lead?.phone ? `91${lead.phone}` : ''}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--bg)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto space-y-4 animate-sheet-up"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-extrabold">Share Property on WhatsApp</h3>
            {lead && (
              <div className="text-xs font-semibold text-[var(--label3)]">
                Sending to {lead.name} ({lead.phone})
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!batchProps && (
          <>
            <select
              value={selectedPropId}
              onChange={(e) => {
                setSelectedPropId(e.target.value);
                setVariantLabel('');
              }}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-sm font-bold outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatINR(p.price)}
                </option>
              ))}
            </select>

            {selectedProp && selectedProp.variants.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedProp.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantLabel(v.label)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      variantLabel === v.label
                        ? 'bg-[#27C6A0] text-[#101C35]'
                        : 'bg-[var(--card)] border border-[var(--sep2)]'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}

            <label className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-bold">
              <span>Include Google Maps Link</span>
              <input
                type="checkbox"
                checked={includeMap}
                onChange={(e) => setIncludeMap(e.target.checked)}
                className="w-4 h-4 accent-[#27C6A0]"
              />
            </label>
          </>
        )}

        {/* Live WhatsApp Bubble Preview */}
        <div className="bg-[#e5ddd5] rounded-2xl p-4 shadow-inner">
          <div className="bg-[#dcf8c6] text-[#1f2c34] rounded-xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap shadow-sm">
            {message}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(message);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="py-3 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Message'}
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => onSent(lead?.id)}
            className="py-3 rounded-xl bg-[#27C6A0] text-[#101C35] text-xs font-extrabold flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            Open WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

/* ── 4. CALENDAR MODAL ── */
export const CalendarModal: React.FC<{
  selectedDate: string;
  leads: Lead[];
  onSelectDate: (ds: string) => void;
  onClose: () => void;
}> = ({ selectedDate, leads, onSelectDate, onClose }) => {
  const initial = new Date(selectedDate + 'T00:00:00');
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (d: number) => {
    const dt = new Date(year, month + d, 1);
    setYear(dt.getFullYear());
    setMonth(dt.getMonth());
  };

  const dotsByDate = useMemo(() => {
    const map: Record<string, { follow?: boolean; resched?: boolean; visit?: boolean }> = {};
    leads
      .filter((l) => l.type !== 'trash')
      .forEach((l) => {
        const d = getLeadActiveDate(l);
        if (!d) return;
        map[d] = map[d] || {};
        if (l.type === 'follow') map[d].follow = true;
        if (l.type === 'reschedule') map[d].resched = true;
        if (l.type === 'visit') map[d].visit = true;
      });
    return map;
  }, [leads]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[var(--card)] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 animate-sheet-up"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold">Select Date</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="w-9 h-9 rounded-full bg-[var(--fill3)] flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-bold text-sm">{monthName}</span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="w-9 h-9 rounded-full bg-[var(--fill3)] flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[var(--label3)]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
              2,
              '0'
            )}`;
            const isSel = ds === selectedDate;
            const dots = dotsByDate[ds];
            return (
              <button
                key={ds}
                type="button"
                onClick={() => {
                  onSelectDate(ds);
                  onClose();
                }}
                className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-bold tabular-nums cursor-pointer ${
                  isSel
                    ? 'bg-[#101C35] text-white'
                    : 'hover:bg-[var(--fill3)] text-[var(--label)]'
                }`}
              >
                <span>{day}</span>
                {dots && (
                  <span className="flex items-center gap-0.5">
                    {dots.follow && <span className="w-1.5 h-1.5 rounded-full bg-[#101C35] dark:bg-white" />}
                    {dots.resched && <span className="w-1.5 h-1.5 rounded-full bg-[#ff9500]" />}
                    {dots.visit && <span className="w-1.5 h-1.5 rounded-full bg-[#27C6A0]" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-[var(--label3)] pt-2 border-t border-[var(--sep2)]">
          <span>Follow-up (Navy)</span>
          <span>·</span>
          <span>Reschedule (Orange)</span>
          <span>·</span>
          <span>Visit (Teal)</span>
        </div>
      </div>
    </div>
  );
};

/* ── 5. BULK IMPORT LEADS MODAL ── */
export const ImportLeadsModal: React.FC<{
  onImport: (items: { name: string; phone: string }[]) => void;
  onClose: () => void;
}> = ({ onImport, onClose }) => {
  const [country, setCountry] = useState('IN (+91)');
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<{ name: string; phone: string }[]>([]);

  const handleParse = () => {
    const lines = rawText
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const out: { name: string; phone: string }[] = [];
    lines.forEach((line, idx) => {
      const digits = line.replace(/\D/g, '');
      const phone = digits.length >= 10 ? digits.slice(-10) : digits;
      const namePart = line.replace(/[+\d\s,-]{7,}/g, '').replace(/[,:-]+/g, ' ').trim();
      if (phone.length >= 10) {
        out.push({ name: namePart || `Lead ${idx + 1}`, phone });
      }
    });
    setParsed(out);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--bg)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4 animate-sheet-up"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold">Import List</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-sm font-bold outline-none"
        >
          <option>India (+91)</option>
          <option>UAE (+971)</option>
          <option>USA / Canada (+1)</option>
          <option>UK (+44)</option>
        </select>

        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={'Ramesh Sharma, 9876543210\n+91 98260 11223 Priya'}
          className="w-full p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--sep2)] text-sm outline-none"
        />

        <button
          type="button"
          onClick={handleParse}
          className="w-full py-3 rounded-xl bg-[#101C35] text-white text-xs font-extrabold cursor-pointer"
        >
          Parse Numbers
        </button>

        {parsed.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#27C6A0]">
              {parsed.length} leads detected
            </div>
            {parsed.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--card)] text-xs font-semibold"
              >
                <span>{item.name}</span>
                <span className="tabular-nums text-[var(--label3)]">{item.phone}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                onImport(parsed);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-[#27C6A0] text-[#101C35] text-xs font-extrabold cursor-pointer"
            >
              Add All to Today
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── 6. NOTIFICATIONS MODAL ── */
export const NotificationsModal: React.FC<{
  notifications: NotificationItem[];
  onClearAll: () => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}> = ({ notifications, onClearAll, onMarkRead, onClose }) => (
  <div
    onClick={onClose}
    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md bg-[var(--bg)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto space-y-3 animate-sheet-up"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-extrabold">Notifications</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-bold text-[#101C35] dark:text-[#27C6A0] cursor-pointer"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="p-8 text-center text-sm text-[var(--label3)] bg-[var(--card)] rounded-2xl">
          All caught up!
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`p-3.5 rounded-2xl bg-[var(--card)] border cursor-pointer ${
                n.read ? 'border-[var(--sep2)] opacity-70' : 'border-[#27C6A0]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-extrabold">{n.title}</div>
                <div className="text-[10px] font-semibold text-[var(--label3)]">{n.time}</div>
              </div>
              <div className="text-xs text-[var(--label2)] mt-1">{n.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

/* ── 7. TRASH MODAL ── */
export const TrashModal: React.FC<{
  trashedLeads: Lead[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
  onClose: () => void;
}> = ({ trashedLeads, onRestore, onPermanentDelete, onEmptyTrash, onClose }) => (
  <div
    onClick={onClose}
    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md bg-[var(--bg)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto space-y-3 animate-sheet-up"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-extrabold">Trash</h3>
        <div className="flex items-center gap-3">
          {trashedLeads.length > 0 && (
            <button
              type="button"
              onClick={onEmptyTrash}
              className="text-xs font-bold text-[#ff3b30] cursor-pointer"
            >
              Empty All
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {trashedLeads.length === 0 ? (
        <div className="p-8 text-center text-sm text-[var(--label3)] bg-[var(--card)] rounded-2xl">
          Trash is empty.
        </div>
      ) : (
        <div className="space-y-2">
          {trashedLeads.map((l) => (
            <div
              key={l.id}
              className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--sep2)] flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-sm font-bold">{l.name}</div>
                <div className="text-xs text-[var(--label3)] tabular-nums">{l.phone}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onRestore(l.id)}
                  className="px-3 py-1.5 rounded-xl bg-[#101C35]/10 text-[#101C35] dark:bg-[#27C6A0]/15 dark:text-[#27C6A0] text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                </button>
                <button
                  type="button"
                  onClick={() => onPermanentDelete(l.id)}
                  aria-label="Delete forever"
                  className="w-8 h-8 rounded-xl bg-[#ff3b30]/12 text-[#ff3b30] flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

/* ── 8. GLOBAL SEARCH MODAL ── */
export const GlobalSearchModal: React.FC<{
  leads: Lead[];
  properties: Property[];
  onSelectLead: (lead: Lead) => void;
  onSelectProperty: () => void;
  onClose: () => void;
}> = ({ leads, properties, onSelectLead, onSelectProperty, onClose }) => {
  const [q, setQ] = useState('');
  const ql = q.toLowerCase().trim();

  const matchedLeads = useMemo(
    () =>
      ql
        ? leads.filter(
            (l) =>
              l.type !== 'trash' &&
              `${l.name} ${l.phone} ${l.todayTalk || ''}`.toLowerCase().includes(ql)
          )
        : [],
    [leads, ql]
  );

  const matchedProps = useMemo(
    () =>
      ql
        ? properties.filter((p) =>
            `${p.name} ${p.location} ${p.bhk || ''}`.toLowerCase().includes(ql)
          )
        : [],
    [properties, ql]
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--card)] rounded-3xl p-4 shadow-2xl space-y-3 animate-sheet-up"
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[var(--fill3)] rounded-xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-[var(--label3)]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, property..."
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold text-[#101C35] dark:text-[#27C6A0] px-2 cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {matchedLeads.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                onSelectLead(l);
                onClose();
              }}
              className="w-full p-3 rounded-xl bg-[var(--fill3)] text-left flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="text-sm font-bold">{l.name}</div>
                <div className="text-xs text-[var(--label3)] tabular-nums">{l.phone}</div>
              </div>
              <span className="text-xs font-bold text-[#101C35] dark:text-[#27C6A0]">Lead</span>
            </button>
          ))}
          {matchedProps.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelectProperty();
                onClose();
              }}
              className="w-full p-3 rounded-xl bg-[var(--fill3)] text-left flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="text-sm font-bold">{p.name}</div>
                <div className="text-xs text-[var(--label3)]">{p.location}</div>
              </div>
              <span className="text-xs font-bold text-[#27C6A0] tabular-nums">
                {formatINR(p.price)}
              </span>
            </button>
          ))}
          {ql && matchedLeads.length === 0 && matchedProps.length === 0 && (
            <div className="p-6 text-center text-xs text-[var(--label3)]">
              No results found for &ldquo;{q}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
