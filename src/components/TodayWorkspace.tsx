import React, { useMemo, useState } from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  PlayCircle,
  Plus,
  Search,
  Upload,
  UserPlus,
  ArrowRightLeft,
  CheckCircle2,
  Trash2,
  Edit3,
  Layers,
} from 'lucide-react';
import type {
  BrokerProfile,
  Deal,
  Lead,
  MainTabFilter,
  Property,
} from '../types/crm';
import {
  dueSinceLabel,
  formatDisplayDate,
  formatShortDate,
  getLeadActiveDate,
  todayStr,
} from '../utils/crmHelpers';

interface TodayWorkspaceProps {
  profile: BrokerProfile;
  selectedDate: string;
  onShiftDate: (delta: number) => void;
  onOpenCalendar: () => void;
  leads: Lead[];
  properties: Property[];
  deals: Deal[];
  unreadNotifCount: number;
  tabFilter: MainTabFilter;
  onSetTabFilter: (t: MainTabFilter) => void;
  propFilterId: string;
  onSetPropFilterId: (id: string) => void;
  onOpenTutorials: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
  onOpenDeals: (stage?: 'svdone' | 'token' | 'full') => void;
  onOpenRequirements: () => void;
  onCallLead: (lead: Lead) => void;
  onWhatsAppLead: (lead: Lead) => void;
  onQuickMoveLead: (lead: Lead) => void;
  onSvDoneLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onTrashLead: (lead: Lead) => void;
  onAddLead: () => void;
  onOpenImport: () => void;
  onOpenContacts: () => void;
  onOpenBriefing: () => void;
}

const LEAD_TYPE_LABEL: Record<string, string> = {
  new: 'New Lead',
  follow: 'Follow-up',
  visit: 'Site Visit',
  reschedule: 'Reschedule',
  plfollow: 'PL Follow',
  unatt: 'Unattended',
  unatt_npu: 'Unatt. NPU',
  npu: 'Not Picked',
  requirement: 'Requirement',
  dealdone: 'Deal Done',
};

export const TodayWorkspace: React.FC<TodayWorkspaceProps> = ({
  profile,
  selectedDate,
  onShiftDate,
  onOpenCalendar,
  leads,
  properties,
  deals,
  unreadNotifCount,
  tabFilter,
  onSetTabFilter,
  propFilterId,
  onSetPropFilterId,
  onOpenTutorials,
  onOpenNotifications,
  onOpenProfile,
  onOpenSearch,
  onOpenDeals,
  onOpenRequirements,
  onCallLead,
  onWhatsAppLead,
  onQuickMoveLead,
  onSvDoneLead,
  onEditLead,
  onTrashLead,
  onAddLead,
  onOpenImport,
  onOpenContacts,
  onOpenBriefing,
}) => {
  const [plExpanded, setPlExpanded] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const td = todayStr();
  const isToday = selectedDate === td;
  const activeLeads = useMemo(
    () => leads.filter((l) => l.type !== 'trash' && !l.isLeakage),
    [leads]
  );

  const propMap = useMemo(() => {
    const m: Record<string, Property> = {};
    properties.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [properties]);

  const counts = useMemo(() => {
    const visit = activeLeads.filter((l) => l.type === 'visit' && !l.inPipeline && !l.isDealDone).length;
    const follow = activeLeads.filter((l) => l.type === 'follow' && !l.inPipeline && !l.isDealDone).length;
    const plfollow = activeLeads.filter((l) => l.inPipeline || l.type === 'plfollow').length;
    const svDone = deals.filter((d) => d.stage === 'svdone' && !d.isLeakage).length;
    const token = deals.filter((d) => d.stage === 'token' && !d.isLeakage).length;
    const reschedule = activeLeads.filter((l) => l.type === 'reschedule').length;
    const newL = activeLeads.filter((l) => l.type === 'new').length;
    const unatt = activeLeads.filter((l) => l.type === 'unatt').length;
    const req = activeLeads.filter((l) => l.type === 'requirement' || l.isRequirementLead).length;
    const unattNpu = activeLeads.filter((l) => l.type === 'unatt_npu').length;
    const npu = activeLeads.filter((l) => l.type === 'npu').length;
    const dealDone = deals.filter((d) => d.stage === 'full').length;
    const total = activeLeads.filter((l) => !l.isDealDone).length;
    return {
      total,
      visit,
      follow,
      plfollow,
      svDone,
      token,
      reschedule,
      newL,
      unatt,
      req,
      unattNpu,
      npu,
      dealDone,
    };
  }, [activeLeads, deals]);

  const filteredLeads = useMemo(() => {
    return activeLeads.filter((l) => {
      if (propFilterId && l.propertyId !== propFilterId) return false;
      if (tabFilter !== 'all') {
        if (tabFilter === 'plfollow') {
          if (!l.inPipeline && l.type !== 'plfollow') return false;
        } else if (tabFilter === 'requirement') {
          if (l.type !== 'requirement' && !l.isRequirementLead) return false;
        } else if (tabFilter === 'dealdone') {
          if (!l.isDealDone && l.type !== 'dealdone') return false;
        } else if (l.type !== tabFilter) {
          return false;
        }
      }
      // When viewing a specific non-today date with "all" filter, match date or overdue
      if (tabFilter === 'all' && !isToday) {
        return getLeadActiveDate(l) === selectedDate;
      }
      return true;
    });
  }, [activeLeads, propFilterId, tabFilter, isToday, selectedDate]);

  const { overdueLeads, todayAndOtherLeads } = useMemo(() => {
    const overdue: Lead[] = [];
    const current: Lead[] = [];
    filteredLeads.forEach((l) => {
      const ad = getLeadActiveDate(l);
      if (isToday && ad && ad < td && !l.isDealDone) {
        overdue.push(l);
      } else {
        current.push(l);
      }
    });
    return { overdueLeads: overdue, todayAndOtherLeads: current };
  }, [filteredLeads, isToday, td]);

  const initials = (profile.name || 'A')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderLeadCard = (l: Lead, isOverdue: boolean) => {
    const prop = l.propertyId ? propMap[l.propertyId] : undefined;
    const activeDate = getLeadActiveDate(l);
    const dueLabel = isOverdue ? dueSinceLabel(activeDate) : '';
    const timeStr = l.visitTime || l.followTime || l.reschedTime || '';

    return (
      <div
        key={l.id}
        className="bg-[var(--card)] rounded-[22px] p-4 border border-[var(--sep2)] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-[17px] font-bold tracking-tight truncate">
                  {l.name}
                </h3>
                {l.nickname && (
                  <span className="text-xs font-medium text-[var(--label3)]">
                    · {l.nickname}
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-[var(--label3)] tabular-nums mt-0.5">
                {l.phone || 'No number'}
                {l.budget ? ` · ${l.budget}` : ''}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div
                className={`text-xs font-bold whitespace-nowrap ${
                  l.type === 'visit'
                    ? 'text-[#27C6A0]'
                    : l.type === 'reschedule'
                      ? 'text-[#ff9500]'
                      : l.type === 'requirement'
                        ? 'text-[#101C35] dark:text-[#27C6A0]'
                        : l.type === 'npu' || l.type === 'unatt_npu' || l.type === 'unatt'
                          ? 'text-[#ff3b30]'
                          : 'text-[#101C35] dark:text-[#27C6A0]'
                }`}
              >
                {LEAD_TYPE_LABEL[l.type] || l.type}
              </div>
              <div className="text-[11px] font-semibold text-[var(--label3)] tabular-nums mt-0.5">
                {formatShortDate(activeDate)}
                {timeStr ? ` · ${timeStr}` : ''}
              </div>
            </div>
          </div>

          {dueLabel && (
            <div className="mt-2 text-xs font-bold text-[#ff3b30]">{dueLabel}</div>
          )}

          {prop && (
            <div className="mt-2.5 text-xs font-semibold text-[var(--label2)] bg-[var(--fill3)] rounded-xl px-3 py-2 flex items-center justify-between gap-2">
              <span className="truncate">
                {prop.name}
                {l.variantLabel ? ` · ${l.variantLabel}` : ''}
              </span>
              <span className="text-[var(--label3)] shrink-0">{prop.location}</span>
            </div>
          )}

          {(l.todayTalk || l.nextPts) && (
            <div className="mt-2.5 text-xs text-[var(--label2)] leading-relaxed space-y-1">
              {l.todayTalk && (
                <div className="line-clamp-2">
                  <span className="font-bold text-[var(--label)]">Talk:</span> {l.todayTalk}
                </div>
              )}
              {l.nextPts && (
                <div className="line-clamp-2 text-[var(--label3)]">
                  <span className="font-bold text-[var(--label2)]">Next:</span> {l.nextPts}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="pt-2.5 border-t border-[var(--sep2)] flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCallLead(l)}
              className="h-9 px-3 rounded-xl bg-[#101C35] text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </button>
            <button
              type="button"
              onClick={() => onWhatsAppLead(l)}
              className="h-9 px-3 rounded-xl bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0] text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => onQuickMoveLead(l)}
              className="h-9 px-2.5 rounded-xl bg-[var(--fill3)] text-[var(--label2)] text-xs font-bold flex items-center gap-1 hover:bg-[var(--fill2)] cursor-pointer whitespace-nowrap"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Move
            </button>
          </div>

          <div className="flex items-center gap-1">
            {l.type === 'visit' && (
              <button
                type="button"
                onClick={() => onSvDoneLead(l)}
                title="Mark Site Visit Done"
                className="h-9 px-2.5 rounded-xl bg-[#27C6A0] text-[#101C35] text-xs font-extrabold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                SV Done
              </button>
            )}
            <button
              type="button"
              onClick={() => onEditLead(l)}
              aria-label="Edit lead"
              className="w-9 h-9 rounded-xl bg-[var(--fill3)] text-[var(--label2)] flex items-center justify-center hover:bg-[var(--fill2)] cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onTrashLead(l)}
              aria-label="Move to trash"
              className="w-9 h-9 rounded-xl bg-[var(--fill3)] text-[#ff3b30] flex items-center justify-center hover:bg-[#ff3b30]/10 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-32 max-w-6xl mx-auto">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-xl px-4 pt-3 pb-2.5 border-b border-[var(--sep2)]">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <button
            type="button"
            onClick={onOpenBriefing}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#101C35] to-[#27C6A0] flex items-center justify-center shadow-sm">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <span className="font-display text-xl font-black tracking-tight text-[var(--label)] whitespace-nowrap">
              Digital <span className="text-[#27C6A0]">CRM</span>
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenBriefing}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-bold text-[var(--label2)] hover:text-[var(--label)] cursor-pointer whitespace-nowrap"
            >
              Day Briefing
            </button>
            <button
              type="button"
              onClick={onOpenTutorials}
              title="Guides & Tutorials"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--label3)] hover:text-[var(--label)] hover:bg-[var(--fill3)] cursor-pointer"
            >
              <PlayCircle className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenNotifications}
              title="Notifications"
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-[var(--label3)] hover:text-[var(--label)] hover:bg-[var(--fill3)] cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#ff3b30] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotifCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenProfile}
              title="My Profile"
              className="w-9 h-9 rounded-full bg-[#101C35] dark:bg-[#27C6A0] text-white dark:text-[#101C35] text-xs font-extrabold flex items-center justify-center shadow-sm cursor-pointer shrink-0"
            >
              {initials}
            </button>
          </div>
        </div>

        {/* Date Navigation Bar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onShiftDate(-1)}
            aria-label="Previous day"
            className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--sep2)] flex items-center justify-center text-[#101C35] dark:text-[#27C6A0] shadow-xs active:scale-95 transition-transform cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenCalendar}
            className={`flex-1 h-10 rounded-xl px-4 flex items-center justify-center gap-2 font-semibold text-sm border shadow-xs transition-colors cursor-pointer ${
              isToday
                ? 'bg-[var(--card)] border-[var(--sep2)] text-[var(--label)]'
                : 'bg-[#ff3b30]/10 border-[#ff3b30]/25 text-[#ff3b30]'
            }`}
          >
            <CalendarIcon className={`w-4 h-4 ${isToday ? 'text-[#27C6A0]' : 'text-[#ff3b30]'}`} />
            <span>{formatDisplayDate(selectedDate)}</span>
          </button>

          <button
            type="button"
            onClick={() => onShiftDate(1)}
            aria-label="Next day"
            className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--sep2)] flex items-center justify-center text-[#101C35] dark:text-[#27C6A0] shadow-xs active:scale-95 transition-transform cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Funnel Stats Strip */}
      <div className="flex items-center gap-2 px-4 pt-3 overflow-x-auto no-scrollbar">
        {[
          { key: 'all' as MainTabFilter, label: 'Total', num: counts.total, color: '' },
          { key: 'visit' as MainTabFilter, label: 'Site Visit', num: counts.visit, color: '' },
          { key: 'follow' as MainTabFilter, label: 'Follow-up', num: counts.follow, color: '' },
        ].map((st) => (
          <button
            key={st.key}
            type="button"
            onClick={() => onSetTabFilter(st.key)}
            className={`shrink-0 min-w-[66px] px-3 py-2 rounded-xl border text-center transition-all cursor-pointer ${
              tabFilter === st.key
                ? 'bg-[#101C35] border-[#101C35] text-white shadow-sm'
                : 'bg-[var(--card)] border-[var(--sep2)] text-[var(--label)]'
            }`}
          >
            <div className="text-base font-extrabold leading-none tabular-nums">{st.num}</div>
            <div
              className={`text-[10px] font-bold uppercase tracking-wide mt-1 whitespace-nowrap ${
                tabFilter === st.key ? 'text-white/90' : 'text-[var(--label3)]'
              }`}
            >
              {st.label}
            </div>
          </button>
        ))}

        {/* Expandable Pipeline Stat Card */}
        <button
          type="button"
          onClick={() => setPlExpanded((p) => !p)}
          className="shrink-0 px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--sep2)] flex items-center gap-1.5 cursor-pointer"
        >
          <div className="text-center">
            <div className="text-base font-extrabold leading-none text-[#27C6A0] tabular-nums">
              {counts.plfollow}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#27C6A0] mt-1">
              Pipeline
            </div>
          </div>
          <ChevronRight
            className={`w-3.5 h-3.5 text-[#27C6A0] transition-transform ${
              plExpanded ? 'rotate-90' : ''
            }`}
          />
        </button>

        {plExpanded && (
          <>
            <button
              type="button"
              onClick={() => onOpenDeals('svdone')}
              className="shrink-0 min-w-[66px] px-3 py-2 rounded-xl bg-[var(--card)] border border-[#27C6A0]/40 text-center cursor-pointer"
            >
              <div className="text-base font-extrabold leading-none text-[#27C6A0] tabular-nums">
                {counts.svDone}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#27C6A0] mt-1 whitespace-nowrap">
                SV Done
              </div>
            </button>
            <button
              type="button"
              onClick={() => onOpenDeals('token')}
              className="shrink-0 min-w-[66px] px-3 py-2 rounded-xl bg-[var(--card)] border border-[#b8860b]/30 text-center cursor-pointer"
            >
              <div className="text-base font-extrabold leading-none text-[#b8860b] tabular-nums">
                {counts.token}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#b8860b] mt-1 whitespace-nowrap">
                Token
              </div>
            </button>
          </>
        )}

        {[
          { key: 'reschedule' as MainTabFilter, label: 'Reschedule', num: counts.reschedule, textClass: '' },
          { key: 'new' as MainTabFilter, label: 'New', num: counts.newL, textClass: '' },
          { key: 'unatt' as MainTabFilter, label: 'Unattended', num: counts.unatt, textClass: '' },
          { key: 'requirement' as MainTabFilter, label: 'Req.', num: counts.req, textClass: 'text-[#27C6A0]' },
        ].map((st) => (
          <button
            key={st.key}
            type="button"
            onClick={() =>
              st.key === 'requirement' && tabFilter === 'requirement'
                ? onOpenRequirements()
                : onSetTabFilter(st.key)
            }
            className={`shrink-0 min-w-[66px] px-3 py-2 rounded-xl border text-center transition-all cursor-pointer ${
              tabFilter === st.key
                ? 'bg-[#101C35] border-[#101C35] text-white shadow-sm'
                : 'bg-[var(--card)] border-[var(--sep2)] text-[var(--label)]'
            }`}
          >
            <div
              className={`text-base font-extrabold leading-none tabular-nums ${
                tabFilter === st.key ? 'text-white' : st.textClass
              }`}
            >
              {st.num}
            </div>
            <div
              className={`text-[10px] font-bold uppercase tracking-wide mt-1 whitespace-nowrap ${
                tabFilter === st.key ? 'text-white/90' : st.textClass || 'text-[var(--label3)]'
              }`}
            >
              {st.label}
            </div>
          </button>
        ))}

        <div className="w-px h-8 bg-[var(--sep2)] shrink-0 mx-1" />

        <button
          type="button"
          onClick={() => onSetTabFilter('unatt_npu')}
          className={`shrink-0 min-w-[72px] px-3 py-2 rounded-xl border text-center cursor-pointer ${
            tabFilter === 'unatt_npu'
              ? 'bg-[#ff3b30] border-[#ff3b30] text-white'
              : 'bg-[var(--card)] border-[var(--sep2)] text-[#ff3b30]'
          }`}
        >
          <div className="text-base font-extrabold leading-none tabular-nums">
            {counts.unattNpu}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wide mt-1 whitespace-nowrap">
            Unatt. NPU
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSetTabFilter('npu')}
          className={`shrink-0 min-w-[72px] px-3 py-2 rounded-xl border text-center cursor-pointer ${
            tabFilter === 'npu'
              ? 'bg-[#ff3b30] border-[#ff3b30] text-white'
              : 'bg-[var(--card)] border-[var(--sep2)] text-[var(--label)]'
          }`}
        >
          <div className="text-base font-extrabold leading-none tabular-nums">{counts.npu}</div>
          <div
            className={`text-[10px] font-bold uppercase tracking-wide mt-1 whitespace-nowrap ${
              tabFilter === 'npu' ? 'text-white/90' : 'text-[var(--label3)]'
            }`}
          >
            Not Picked
          </div>
        </button>

        <div className="w-px h-8 bg-[var(--sep2)] shrink-0 mx-1" />

        <button
          type="button"
          onClick={() => onOpenDeals('full')}
          className="shrink-0 min-w-[72px] px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-center text-[#b8860b] cursor-pointer"
        >
          <div className="text-base font-extrabold leading-none tabular-nums">{counts.dealDone}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide mt-1 whitespace-nowrap">
            Deal Done
          </div>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="flex items-center gap-2.5 px-4 pt-3">
        <select
          value={tabFilter}
          onChange={(e) => onSetTabFilter(e.target.value as MainTabFilter)}
          className="px-3.5 py-2 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-bold text-[var(--label)] outline-none cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="visit">Site Visit</option>
          <option value="follow">Follow-up</option>
          <option value="reschedule">Reschedule</option>
          <option value="plfollow">PL Follow</option>
          <option value="new">New Lead</option>
          <option value="unatt">Unattended</option>
          <option value="unatt_npu">Unattended NPU</option>
          <option value="npu">Not Picked Up</option>
          <option value="requirement">Requirement</option>
        </select>

        <select
          value={propFilterId}
          onChange={(e) => onSetPropFilterId(e.target.value)}
          className="flex-1 sm:flex-none sm:min-w-[180px] px-3.5 py-2 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-bold text-[var(--label)] outline-none cursor-pointer"
        >
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onOpenRequirements}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#27C6A0]/15 text-[#101C35] dark:text-[#27C6A0] text-xs font-bold cursor-pointer whitespace-nowrap"
        >
          <Layers className="w-3.5 h-3.5" />
          Requirements ({counts.req})
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search leads and properties"
          className="w-9 h-9 rounded-xl bg-[var(--card)] border border-[var(--sep2)] flex items-center justify-center text-[var(--label)] shrink-0 cursor-pointer ml-auto"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Main Lead Sections */}
      <main className="px-4 pt-4 space-y-6">
        {overdueLeads.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <h2 className="font-display text-lg font-extrabold tracking-tight text-[#ff3b30]">
                Overdue
              </h2>
              <span className="text-xs font-bold text-[#ff3b30] tabular-nums">
                {overdueLeads.length}
              </span>
              <div className="flex-1 h-px bg-[#ff3b30]/20" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {overdueLeads.map((l) => renderLeadCard(l, true))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2.5 mb-3">
            <h2 className="font-display text-lg font-extrabold tracking-tight">
              {tabFilter === 'all' ? (isToday ? 'Today & Active' : formatDisplayDate(selectedDate)) : LEAD_TYPE_LABEL[tabFilter] || 'Leads'}
            </h2>
            <span className="text-xs font-bold text-[var(--label3)] tabular-nums">
              {todayAndOtherLeads.length}
            </span>
            <div className="flex-1 h-px bg-[var(--sep2)]" />
          </div>

          {todayAndOtherLeads.length === 0 && overdueLeads.length === 0 ? (
            <div className="bg-[var(--card)] rounded-3xl border border-[var(--sep2)] p-10 text-center">
              <div className="font-display text-lg font-bold mb-1">No leads for this filter</div>
              <p className="text-sm text-[var(--label3)] mb-5">
                Add a new lead, import from WhatsApp list, or reset filters.
              </p>
              <div className="flex items-center justify-center gap-3">
                {tabFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSetTabFilter('all');
                      onSetPropFilterId('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[var(--fill2)] text-xs font-bold cursor-pointer"
                  >
                    Show All Leads
                  </button>
                )}
                <button
                  type="button"
                  onClick={onAddLead}
                  className="px-4 py-2.5 rounded-xl bg-[#101C35] text-white text-xs font-bold cursor-pointer"
                >
                  + Add New Lead
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {todayAndOtherLeads.map((l) => renderLeadCard(l, false))}
            </div>
          )}
        </section>
      </main>

      {/* Expandable Floating Action Button */}
      <div className="fixed bottom-24 right-5 z-40 flex flex-col items-end gap-2.5">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 animate-sheet-up">
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                onOpenImport();
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <span className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--sep2)] shadow-md text-xs font-bold">
                Import Leads
              </span>
              <span className="w-11 h-11 rounded-full bg-[var(--card)] border border-[var(--sep2)] text-[#27C6A0] shadow-md flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                onAddLead();
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <span className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--sep2)] shadow-md text-xs font-bold">
                Add Lead
              </span>
              <span className="w-11 h-11 rounded-full bg-[#101C35] text-white shadow-md flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                onOpenContacts();
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <span className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--sep2)] shadow-md text-xs font-bold">
                From Contacts
              </span>
              <span className="w-11 h-11 rounded-full bg-[#27C6A0] text-[#101C35] shadow-md flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setFabOpen((o) => !o)}
          aria-label="Add or import leads"
          className={`w-14 h-14 rounded-full bg-[#101C35] text-white shadow-xl shadow-[#101C35]/35 flex items-center justify-center transition-transform duration-200 cursor-pointer ${
            fabOpen ? 'rotate-45 bg-[#27C6A0] text-[#101C35]' : ''
          }`}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
