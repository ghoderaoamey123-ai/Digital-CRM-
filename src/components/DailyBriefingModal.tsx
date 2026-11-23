import React from 'react';
import { X } from 'lucide-react';
import type { BrokerProfile, Deal, Lead, Property } from '../types/crm';
import { formatINR, getGreetingByTime, todayStr } from '../utils/crmHelpers';

interface DailyBriefingModalProps {
  profile: BrokerProfile;
  leads: Lead[];
  properties: Property[];
  deals: Deal[];
  onClose: () => void;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  profile,
  leads,
  properties,
  deals,
  onClose,
}) => {
  const td = todayStr();
  const active = leads.filter((l) => l.type !== 'trash');
  const fuCount = active.filter((l) => l.type === 'follow' && (l.nextFollowup || l.leadDate) <= td).length;
  const svCount = active.filter((l) => l.type === 'visit' && !l.inPipeline).length;
  const rsCount = active.filter((l) => l.type === 'reschedule').length;
  const pipeLeads = active.filter((l) => l.inPipeline && !l.isLeakage).length;
  const saleInv = properties.filter((p) => !p.isSoldOut && p.purpose === 'sale').length;

  const commPotential = deals
    .filter((d) => !d.isLeakage && d.stage !== 'full')
    .reduce((sum, d) => sum + (d.commAmount || 0), 0);
  const commEarned = deals
    .filter((d) => d.stage === 'full')
    .reduce((sum, d) => sum + (d.commAmount || 0), 0);

  const propLeadCounts: Record<string, number> = {};
  active.forEach((l) => {
    if (l.propertyId) propLeadCounts[l.propertyId] = (propLeadCounts[l.propertyId] || 0) + 1;
  });
  const topProps = [...properties]
    .sort((a, b) => (propLeadCounts[b.id] || 0) - (propLeadCounts[a.id] || 0))
    .slice(0, 3);

  const totalCalls = active.reduce((s, l) => s + (l.callsCount || 0), 0);
  const totalWa = active.reduce((s, l) => s + (l.waCount || 0), 0);
  const firstName = (profile.name || '').split(' ')[0] || 'Broker';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-[var(--bg)] border border-[var(--sep2)] p-5 shadow-2xl space-y-3 animate-sheet-up"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-xl font-extrabold leading-tight">
              {getGreetingByTime()}, {firstName}!
            </div>
            <div className="text-xs font-semibold text-[#27C6A0] mt-0.5">
              Today&apos;s Broker Briefing · {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close briefing"
            className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center text-[var(--label3)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Today's Work */}
        <div className="bg-[var(--card)] rounded-2xl p-3.5 shadow-sm grid grid-cols-3 divide-x divide-[var(--sep2)] text-center">
          <div>
            <div className="text-xl font-extrabold text-[#101C35] dark:text-[#27C6A0] tabular-nums">{fuCount}</div>
            <div className="text-[11px] font-semibold text-[var(--label3)]">Follow-up</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#27C6A0] tabular-nums">{svCount}</div>
            <div className="text-[11px] font-semibold text-[var(--label3)]">Site Visit</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#ff9500] tabular-nums">{rsCount}</div>
            <div className="text-[11px] font-semibold text-[var(--label3)]">Reschedule</div>
          </div>
        </div>

        {/* Key Numbers */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[var(--card)] rounded-2xl p-3 text-center shadow-sm">
            <div className="text-lg font-extrabold tabular-nums">{active.length}</div>
            <div className="text-[11px] font-semibold text-[var(--label3)]">Leads</div>
          </div>
          <div className="bg-[var(--card)] rounded-2xl p-3 text-center shadow-sm">
            <div className="text-lg font-extrabold text-[#27C6A0] tabular-nums">{pipeLeads}</div>
            <div className="text-[11px] font-semibold text-[var(--label3)]">Pipeline</div>
          </div>
          <div className="bg-[var(--card)] rounded-2xl p-3 text-center shadow-sm">
            <div className="text-lg font-extrabold text-[#101C35] dark:text-[#27C6A0] tabular-nums">{saleInv}</div>
            <div className="text-[11px] font-semibold text-[var(--label3)]">Inventory</div>
          </div>
        </div>

        {/* Potential Commission Hero */}
        <div className="rounded-2xl p-4 bg-[#27C6A0]/12 border border-[#27C6A0]/35">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#101C35] dark:text-[#27C6A0]">
            Potential Commission
          </div>
          <div className="text-3xl font-black text-[#101C35] dark:text-[#27C6A0] tracking-tight tabular-nums mt-0.5">
            {formatINR(commPotential)}
          </div>
          <div className="text-xs text-[var(--label3)] mt-1 tabular-nums">
            {formatINR(commEarned)} earned · {deals.length} deal{deals.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Top 3 Properties + Activity */}
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-3 bg-[var(--card)] rounded-2xl p-3 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--label3)] mb-2">
              Top Properties
            </div>
            <div className="space-y-1.5">
              {topProps.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold truncate pr-2">{p.name}</span>
                  <span className="text-[var(--label3)] shrink-0 tabular-nums">
                    {propLeadCounts[p.id] || 0} leads
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 bg-[var(--card)] rounded-2xl p-3 shadow-sm flex flex-col justify-center gap-2">
            <div>
              <div className="text-lg font-extrabold text-[#101C35] dark:text-[#27C6A0] tabular-nums leading-none">
                {totalCalls}
              </div>
              <div className="text-[10px] font-bold uppercase text-[var(--label3)] mt-0.5">
                Calls
              </div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-[#27C6A0] tabular-nums leading-none">
                {totalWa}
              </div>
              <div className="text-[10px] font-bold uppercase text-[var(--label3)] mt-0.5">
                WhatsApp
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[#101C35] text-white font-bold text-sm cursor-pointer"
        >
          Enter CRM Workspace
        </button>
      </div>
    </div>
  );
};
