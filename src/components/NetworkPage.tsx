import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Calculator,
  Check,
  ChevronRight,
  Copy,
  Home,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Target,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type {
  BrokerProfile,
  ConnectionRequest,
  NetworkProperty,
  NetworkSubPage,
  Property,
  PropertyPurpose,
  PropertyType,
  Requirement,
} from '../types/crm';
import { DONB_SUGGESTED_BROKERS } from '../data/seedData';
import {
  formatBrokerId,
  formatINR,
  matchRequirementsToProps,
  numToWord,
  PROP_TYPE_META,
} from '../utils/crmHelpers';

interface NetworkPageProps {
  profile: BrokerProfile;
  properties: Property[];
  partnerIds: string[];
  networkProps: NetworkProperty[];
  requests: ConnectionRequest[];
  requirements: Requirement[];
  initialSubPage?: NetworkSubPage;
  onClose: () => void;
  onSendRequest: (broker: BrokerProfile) => void;
  onAcceptRequest: (reqId: string) => void;
  onDeclineRequest: (reqId: string) => void;
  onRemovePartner: (uid: string) => void;
  onToggleSharePropWithPartner: (propId: string, partnerUid: string) => void;
  onAddRequirement: (req: Omit<Requirement, 'id' | 'createdAt'>) => void;
  onSharePropWA: (prop: Property) => void;
}

const SUBPAGE_TITLES: Record<NetworkSubPage, string> = {
  home: 'Network',
  discover: 'Find Brokers',
  partners: 'My Partners',
  pending: 'Pending Requests',
  myprops: 'My Shared Properties',
  partnerprops: 'Partner Properties',
  partnerdetail: 'Partner Profile',
  reqs: 'Requirements & Matches',
  tools: 'Broker Tools',
};

const UNIT_TO_SQFT: Record<string, number> = {
  sqft: 1,
  sqyard: 9,
  sqm: 10.7639,
  acre: 43560,
  hectare: 107639,
};

export const NetworkPage: React.FC<NetworkPageProps> = ({
  profile,
  properties,
  partnerIds,
  networkProps,
  requests,
  requirements,
  initialSubPage = 'home',
  onClose,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemovePartner,
  onToggleSharePropWithPartner,
  onAddRequirement,
  onSharePropWA,
}) => {
  const [stack, setStack] = useState<NetworkSubPage[]>([initialSubPage]);
  const [selectedPartnerUid, setSelectedPartnerUid] = useState<string | null>(null);
  const [partnerDetailTab, setPartnerDetailTab] = useState<'mine' | 'theirs'>('theirs');
  const [reqsTab, setReqsTab] = useState<'reqs' | 'match'>('match');
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Discover / Partners search
  const [brokerSearch, setBrokerSearch] = useState('');
  const [partnerPropFilter, setPartnerPropFilter] = useState('');

  // Share-with modal for My Props
  const [sharingPropId, setSharingPropId] = useState<string | null>(null);

  // Add Requirement sheet
  const [addReqOpen, setAddReqOpen] = useState(false);
  const [rnName, setRnName] = useState('');
  const [rnPhone, setRnPhone] = useState('');
  const [rnCat, setRnCat] = useState<PropertyPurpose>('sale');
  const [rnType, setRnType] = useState<PropertyType>('flat');
  const [rnLoc, setRnLoc] = useState('');
  const [rnBudget, setRnBudget] = useState('');

  // Broker Tools state (Rate Calculator, Unit Converter, Loan EMI)
  const [openTool, setOpenTool] = useState<'rate' | 'unit' | 'loan' | null>('rate');
  const [rcArea, setRcArea] = useState('1500');
  const [rcRate, setRcRate] = useState('3200');
  const [rcTotal, setRcTotal] = useState('4800000');

  const [ucVal, setUcVal] = useState('1000');
  const [ucFrom, setUcFrom] = useState('sqft');
  const [ucTo, setUcTo] = useState('sqyard');

  const [loanPrincipal, setLoanPrincipal] = useState('4000000');
  const [loanRate, setLoanRate] = useState('8.5');
  const [loanYears, setLoanYears] = useState('20');

  const currentPage = stack[stack.length - 1];

  const pushPage = (page: NetworkSubPage) => {
    setStack((s) => [...s, page]);
  };

  const popPage = () => {
    if (stack.length > 1) {
      setStack((s) => s.slice(0, -1));
    } else {
      onClose();
    }
  };

  const connectedPartners = useMemo(
    () => DONB_SUGGESTED_BROKERS.filter((b) => partnerIds.includes(b.uid)),
    [partnerIds]
  );

  // Combined inventory (mine + partners) for auto-matching
  const allMatchableProps = useMemo(() => {
    const partnerConverted: Property[] = networkProps.map((np) => ({
      id: np.id,
      name: `${np.title} (${np.brokerName})`,
      purpose: np.purpose,
      propType: np.propType,
      location: np.location,
      price: np.price,
      areaSqft: np.areaSqft,
      bhk: np.bhk,
      notes: np.notes,
      variants: [],
      createdAt: '',
    }));
    return [...properties, ...partnerConverted];
  }, [properties, networkProps]);

  const matches = useMemo(
    () => matchRequirementsToProps(requirements, allMatchableProps),
    [requirements, allMatchableProps]
  );

  const bannerLines = useMemo(() => {
    const arr: { text: string; target: NetworkSubPage; color: string }[] = [];
    if (matches.length > 0) {
      arr.push({
        text: `${matches.length} property match${matches.length > 1 ? 'es' : ''} found — tap to view`,
        target: 'reqs',
        color: '#27C6A0',
      });
    }
    if (networkProps.length > 0) {
      arr.push({
        text: `${networkProps.length} partner properties shared with you`,
        target: 'partnerprops',
        color: '#101C35',
      });
    }
    if (requests.length > 0) {
      arr.push({
        text: `${requests.length} connection request${requests.length > 1 ? 's' : ''} pending`,
        target: 'pending',
        color: '#ff9500',
      });
    }
    return arr;
  }, [matches.length, networkProps.length, requests.length]);

  useEffect(() => {
    if (bannerLines.length <= 1) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % bannerLines.length), 3200);
    return () => clearInterval(t);
  }, [bannerLines.length]);

  const ucResult = useMemo(() => {
    const v = parseFloat(ucVal) || 0;
    const sqft = v * (UNIT_TO_SQFT[ucFrom] || 1);
    const converted = sqft / (UNIT_TO_SQFT[ucTo] || 1);
    return converted.toFixed(4).replace(/\.?0+$/, '');
  }, [ucVal, ucFrom, ucTo]);

  const emiStats = useMemo(() => {
    const P = parseFloat(loanPrincipal) || 0;
    const annual = parseFloat(loanRate) || 0;
    const yrs = parseFloat(loanYears) || 0;
    if (!P || !annual || !yrs) return { emi: 0, interest: 0, total: 0 };
    const r = annual / 12 / 100;
    const n = yrs * 12;
    const pow = Math.pow(1 + r, n);
    const emi = (P * r * pow) / (pow - 1);
    const total = emi * n;
    return { emi: Math.round(emi), interest: Math.round(total - P), total: Math.round(total) };
  }, [loanPrincipal, loanRate, loanYears]);

  const selectedPartner = connectedPartners.find((p) => p.uid === selectedPartnerUid);

  return (
    <div className="min-h-screen pb-32 max-w-6xl mx-auto">
      {/* Sticky iOS-style Network Nav Bar */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-xl px-4 py-3 border-b border-[var(--sep2)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={popPage}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-[var(--fill2)] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl font-extrabold tracking-tight truncate">
            {SUBPAGE_TITLES[currentPage]}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 500);
            }}
            aria-label="Refresh network"
            className="w-9 h-9 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => pushPage('tools')}
            className="px-3 py-1.5 rounded-full bg-[#101C35]/10 text-[#101C35] dark:bg-[#27C6A0]/15 dark:text-[#27C6A0] text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Calculator className="w-3.5 h-3.5" />
            Tools
          </button>
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* ═══ SUBPAGE 1: NETWORK HOME ═══ */}
        {currentPage === 'home' && (
          <div className="space-y-5">
            {/* Partner Story Row */}
            <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-1">
              {connectedPartners.map((p) => (
                <button
                  key={p.uid}
                  type="button"
                  onClick={() => {
                    setSelectedPartnerUid(p.uid);
                    pushPage('partnerdetail');
                  }}
                  className="shrink-0 w-[68px] flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <div
                    className="w-16 h-16 rounded-full text-white font-extrabold text-xl flex items-center justify-center shadow-md border border-white/40"
                    style={{ background: 'linear-gradient(135deg, #101C35, #27C6A0)' }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-[11px] font-semibold truncate w-full text-center">
                    {p.name.split(' ')[0]}
                  </span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => pushPage('partners')}
                className="shrink-0 w-[68px] flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--card)] border border-[var(--sep2)] flex items-center justify-center shadow-sm">
                  <ChevronRight className="w-5 h-5 text-[var(--label2)]" />
                </div>
                <span className="text-[11px] font-semibold">View All</span>
              </button>
            </div>

            {/* Dark Navy Brushed-Metal Digital Broker Identity Card */}
            <div
              className="relative rounded-[28px] p-6 text-white overflow-hidden shadow-2xl border border-white/15"
              style={{
                background:
                  'radial-gradient(120% 100% at 12% 0%, rgba(39,198,160,0.28), transparent 55%), linear-gradient(155deg, #101C35 0%, #17284a 45%, #0c162b 80%, #070e1c 100%)',
              }}
            >
              {/* Concentric watermark rings */}
              <svg
                viewBox="0 0 100 100"
                className="absolute -top-5 -right-5 w-40 h-40 opacity-10 pointer-events-none"
              >
                <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="2" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="#fff" strokeWidth="1.5" />
              </svg>

              <div className="relative z-10">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/55 mb-1">
                  Digital CRM Broker Identity · {profile.city || 'Indore'}
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  {profile.name}
                </div>

                <div className="pt-4 border-t border-white/15 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-full p-0.5 shrink-0"
                      style={{ background: 'linear-gradient(135deg, #27C6A0, #f2d06b)' }}
                    >
                      <div className="w-full h-full rounded-full bg-[#101C35] flex items-center justify-center font-extrabold text-sm">
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono-id text-xs font-bold tracking-widest text-white/80">
                        {formatBrokerId(profile.id)}
                      </div>
                      <div className="text-[11px] text-white/50 mt-0.5">
                        My Partners: {connectedPartners.length} broker
                        {connectedPartners.length === 1 ? '' : 's'} connected
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShareMenuOpen((o) => !o)}
                      aria-label="Share broker ID"
                      className="w-10 h-10 rounded-full bg-white text-[#101C35] flex items-center justify-center shadow-lg cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {shareMenuOpen && (
                      <div className="absolute right-0 bottom-12 w-52 bg-[var(--card)] text-[var(--label)] rounded-2xl shadow-2xl border border-[var(--sep2)] overflow-hidden z-30">
                        <button
                          type="button"
                          onClick={() => {
                            const txt = encodeURIComponent(
                              `Connect with me on Digital CRM!\nBroker: ${profile.name}\nBroker ID: ${profile.id}\nCity: ${profile.city}`
                            );
                            window.open(`https://wa.me/?text=${txt}`, '_blank');
                            setShareMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-[var(--fill3)] border-b border-[var(--sep2)] cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4 text-[#27C6A0]" />
                          Share on WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(profile.id);
                            setCopiedId(true);
                            setTimeout(() => setCopiedId(false), 1800);
                            setShareMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-[var(--fill3)] cursor-pointer"
                        >
                          <Copy className="w-4 h-4 text-[var(--label2)]" />
                          {copiedId ? 'Copied Broker ID!' : 'Copy Broker ID'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rotating Notification Banner */}
            {!bannerDismissed && bannerLines.length > 0 && (
              <div className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-xs">
                <button
                  type="button"
                  onClick={() => pushPage(bannerLines[bannerIdx % bannerLines.length].target)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${bannerLines[bannerIdx % bannerLines.length].color}20`,
                      color: bannerLines[bannerIdx % bannerLines.length].color,
                    }}
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-bold truncate">
                    {bannerLines[bannerIdx % bannerLines.length].text}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="w-6 h-6 rounded-full bg-[var(--fill2)] flex items-center justify-center text-[var(--label3)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 2-Column Bento Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Tall Left Card: My Property */}
              <button
                type="button"
                onClick={() => pushPage('myprops')}
                className="lg:row-span-2 relative bg-[var(--card)] border border-[var(--sep2)] rounded-3xl p-5 text-left shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between min-h-[180px] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#101C35]/10 text-[#101C35] dark:bg-[#27C6A0]/15 dark:text-[#27C6A0] flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[var(--fill3)] flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-[var(--label2)]" />
                  </div>
                </div>
                <div className="mt-6">
                  <div className="text-4xl font-black tracking-tight tabular-nums">
                    {properties.length}
                  </div>
                  <div className="text-sm font-bold mt-1">My Property</div>
                  <div className="text-xs text-[var(--label3)] mt-0.5">
                    Manage partner visibility
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => pushPage('partnerprops')}
                className="bg-[var(--card)] border border-[var(--sep2)] rounded-3xl p-4 text-left shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0] flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--label3)]" />
                </div>
                <div>
                  <div className="text-2xl font-black tabular-nums">{networkProps.length}</div>
                  <div className="text-xs font-bold mt-0.5">Partner Property</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => pushPage('partners')}
                className="bg-[var(--card)] border border-[var(--sep2)] rounded-3xl p-4 text-left shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0] flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--label3)]" />
                </div>
                <div>
                  <div className="text-2xl font-black tabular-nums">
                    {connectedPartners.length}
                  </div>
                  <div className="text-xs font-bold mt-0.5">My Partners</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => pushPage('reqs')}
                className="bg-[var(--card)] border border-[var(--sep2)] rounded-3xl p-4 text-left shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#101C35]/10 text-[#101C35] dark:bg-[#27C6A0]/15 dark:text-[#27C6A0] flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-[#27C6A0] tabular-nums">
                    {matches.length} matches
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black tabular-nums">{requirements.length}</div>
                  <div className="text-xs font-bold mt-0.5">Requirements &amp; Match</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => pushPage('pending')}
                className="bg-[var(--card)] border border-[var(--sep2)] rounded-3xl p-4 text-left shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ff9500]/12 text-[#ff9500] flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--label3)]" />
                </div>
                <div>
                  <div className="text-2xl font-black tabular-nums">{requests.length}</div>
                  <div className="text-xs font-bold mt-0.5">Pending Requests</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => pushPage('discover')}
                className="bg-[var(--card)] border border-[var(--sep2)] rounded-3xl p-4 text-left shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#101C35]/10 text-[#101C35] dark:bg-[#27C6A0]/15 dark:text-[#27C6A0] flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--label3)]" />
                </div>
                <div>
                  <div className="text-sm font-extrabold">Find Brokers</div>
                  <div className="text-xs text-[var(--label3)] mt-0.5">
                    Search by city or Broker ID
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => pushPage('tools')}
                className="col-span-2 lg:col-span-1 bg-[var(--card)] border border-[var(--sep2)] rounded-3xl p-4 text-left shadow-xs hover:shadow-md transition-shadow flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0] flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">Broker Tools</div>
                    <div className="text-xs text-[var(--label3)]">
                      Rate Calc · Unit Converter · Loan EMI
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--label3)]" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ SUBPAGE 2: DISCOVER / FIND BROKERS ═══ */}
        {currentPage === 'discover' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-[var(--card)] border border-[var(--sep2)] rounded-2xl px-4 py-3">
              <Search className="w-4 h-4 text-[var(--label3)]" />
              <input
                value={brokerSearch}
                onChange={(e) => setBrokerSearch(e.target.value)}
                placeholder="Search broker name, area, city or ID..."
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DONB_SUGGESTED_BROKERS.filter((b) =>
                `${b.name} ${b.city} ${b.workIn} ${b.id}`
                  .toLowerCase()
                  .includes(brokerSearch.toLowerCase())
              ).map((b) => {
                const isPartner = partnerIds.includes(b.uid);
                const isSent = requests.some((r) => r.brokerId === b.uid);
                return (
                  <div
                    key={b.id}
                    className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl text-white font-extrabold text-lg flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #101C35, #27C6A0)' }}
                      >
                        {b.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold truncate">{b.name}</div>
                        <div className="text-xs text-[var(--label3)] truncate">
                          {b.city} · {b.workIn}
                        </div>
                        <div className="text-[11px] font-mono-id font-bold text-[#27C6A0] mt-0.5">
                          {b.id} · {b.propsCount} properties
                        </div>
                      </div>
                    </div>

                    {isPartner ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPartnerUid(b.uid);
                          pushPage('partnerdetail');
                        }}
                        className="px-3.5 py-2 rounded-full bg-[#27C6A0]/20 text-[#101C35] dark:text-[#27C6A0] text-xs font-extrabold cursor-pointer shrink-0"
                      >
                        Partner ✓
                      </button>
                    ) : isSent ? (
                      <span className="px-3.5 py-2 rounded-full bg-[var(--fill3)] text-[var(--label3)] text-xs font-bold shrink-0">
                        Requested
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSendRequest(b)}
                        className="px-4 py-2 rounded-full bg-[#101C35] text-white text-xs font-extrabold cursor-pointer shrink-0"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ SUBPAGE 3: MY PARTNERS ═══ */}
        {currentPage === 'partners' && (
          <div className="space-y-3">
            {connectedPartners.length === 0 ? (
              <div className="bg-[var(--card)] rounded-3xl p-8 text-center border border-[var(--sep2)]">
                <div className="font-bold mb-1">No connected partners yet</div>
                <button
                  type="button"
                  onClick={() => pushPage('discover')}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#101C35] text-white text-xs font-bold cursor-pointer"
                >
                  Find Brokers
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {connectedPartners.map((p) => (
                  <div
                    key={p.uid}
                    onClick={() => {
                      setSelectedPartnerUid(p.uid);
                      pushPage('partnerdetail');
                    }}
                    className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl text-white font-extrabold text-lg flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #101C35, #27C6A0)' }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold truncate">{p.name}</div>
                        <div className="text-xs text-[var(--label3)] truncate">
                          {p.city} · {p.workIn}
                        </div>
                        <div className="text-[11px] font-semibold text-[#27C6A0] mt-0.5">
                          {p.deal}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--label3)] shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ SUBPAGE 4: PENDING REQUESTS ═══ */}
        {currentPage === 'pending' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--label3)] mb-2">
                Incoming Requests
              </div>
              <div className="space-y-2.5">
                {requests
                  .filter((r) => r.direction === 'incoming')
                  .map((r) => (
                    <div
                      key={r.id}
                      className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold truncate">{r.brokerName}</div>
                        <div className="text-xs text-[var(--label3)] truncate">
                          {r.brokerCity} · {r.workIn}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onAcceptRequest(r.id)}
                          className="px-3.5 py-2 rounded-xl bg-[#27C6A0] text-[#101C35] text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineRequest(r.id)}
                          className="px-3 py-2 rounded-xl bg-[var(--fill2)] text-xs font-bold cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                {requests.filter((r) => r.direction === 'incoming').length === 0 && (
                  <div className="text-xs text-[var(--label3)] p-4 bg-[var(--card)] rounded-2xl border border-[var(--sep2)]">
                    No incoming requests right now.
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--label3)] mb-2">
                Sent Requests
              </div>
              <div className="space-y-2.5">
                {requests
                  .filter((r) => r.direction === 'sent')
                  .map((r) => (
                    <div
                      key={r.id}
                      className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold truncate">{r.brokerName}</div>
                        <div className="text-xs text-[var(--label3)] truncate">
                          {r.brokerCity} · Pending approval
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeclineRequest(r.id)}
                        className="px-3 py-2 rounded-xl bg-[#ff3b30]/10 text-[#ff3b30] text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SUBPAGE 5: MY SHARED PROPERTIES ═══ */}
        {currentPage === 'myprops' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {properties.map((p) => {
                const sharedCount = (p.sharedWith || []).length;
                return (
                  <div
                    key={p.id}
                    className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-[#27C6A0]">
                          {PROP_TYPE_META[p.propType].emoji} {PROP_TYPE_META[p.propType].label}
                        </div>
                        <div className="font-display text-base font-extrabold">{p.name}</div>
                        <div className="text-xs text-[var(--label3)]">{p.location}</div>
                      </div>
                      <div className="text-sm font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums">
                        {formatINR(p.price)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--sep2)]">
                      <span className="text-xs font-semibold text-[var(--label3)]">
                        Shared with {sharedCount} partner{sharedCount === 1 ? '' : 's'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSharingPropId(p.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#101C35]/10 text-[#101C35] dark:bg-[#27C6A0]/15 dark:text-[#27C6A0] text-xs font-bold cursor-pointer"
                      >
                        Manage Sharing
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {sharingPropId && (
              <div
                onClick={() => setSharingPropId(null)}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-[var(--card)] rounded-t-3xl sm:rounded-3xl p-5 space-y-3 animate-sheet-up"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-extrabold">Share with Partners</h3>
                    <button
                      type="button"
                      onClick={() => setSharingPropId(null)}
                      className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {connectedPartners.map((b) => {
                      const prop = properties.find((x) => x.id === sharingPropId);
                      const isShared = prop?.sharedWith?.includes(b.uid);
                      return (
                        <label
                          key={b.uid}
                          className="flex items-center justify-between p-3 rounded-xl bg-[var(--fill3)] cursor-pointer"
                        >
                          <div>
                            <div className="text-sm font-bold">{b.name}</div>
                            <div className="text-xs text-[var(--label3)]">{b.city}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={!!isShared}
                            onChange={() => onToggleSharePropWithPartner(sharingPropId, b.uid)}
                            className="w-5 h-5 accent-[#101C35]"
                          />
                        </label>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSharingPropId(null)}
                    className="w-full py-3 rounded-xl bg-[#101C35] text-white font-bold text-sm cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SUBPAGE 6: PARTNER PROPERTIES ═══ */}
        {currentPage === 'partnerprops' && (
          <div className="space-y-4">
            <input
              value={partnerPropFilter}
              onChange={(e) => setPartnerPropFilter(e.target.value)}
              placeholder="Filter partner properties by area, BHK or broker..."
              className="w-full px-4 py-3 rounded-2xl bg-[var(--card)] border border-[var(--sep2)] text-sm font-semibold outline-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {networkProps
                .filter((np) =>
                  `${np.title} ${np.location} ${np.brokerName}`
                    .toLowerCase()
                    .includes(partnerPropFilter.toLowerCase())
                )
                .map((np) => (
                  <div
                    key={np.id}
                    className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-[#27C6A0]">
                          Shared by {np.brokerName}
                        </div>
                        <h3 className="font-display text-base font-extrabold mt-0.5">{np.title}</h3>
                        <div className="text-xs text-[var(--label3)]">
                          {np.location} {np.areaSqft ? `· ${np.areaSqft} sqft` : ''}
                        </div>
                      </div>
                      <div className="text-base font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums shrink-0">
                        {formatINR(np.price)}
                      </div>
                    </div>
                    {np.notes && <p className="text-xs text-[var(--label2)]">{np.notes}</p>}
                    <div className="pt-2 border-t border-[var(--sep2)] flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          onSharePropWA({
                            id: np.id,
                            name: np.title,
                            purpose: np.purpose,
                            propType: np.propType,
                            location: np.location,
                            price: np.price,
                            areaSqft: np.areaSqft,
                            bhk: np.bhk,
                            notes: np.notes,
                            variants: [],
                            createdAt: '',
                          })
                        }
                        className="px-3.5 py-1.5 rounded-xl bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Forward to Client
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ═══ SUBPAGE 7: PARTNER DETAIL ═══ */}
        {currentPage === 'partnerdetail' && selectedPartner && (
          <div className="space-y-4">
            <div
              className="rounded-3xl p-5 text-white shadow-xl"
              style={{ background: 'linear-gradient(145deg, #101C35, #1b315e)' }}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-black">
                  {selectedPartner.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-display text-xl font-extrabold">{selectedPartner.name}</h2>
                  <div className="text-xs text-white/80">
                    {selectedPartner.city} · {selectedPartner.workIn}
                  </div>
                  <div className="inline-block mt-1 px-2 py-0.5 rounded-md bg-white/15 font-mono-id text-[11px] font-bold">
                    {selectedPartner.id}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-white/20 pt-3 text-center">
                <a
                  href={`tel:${selectedPartner.phone}`}
                  className="flex flex-col items-center gap-1 text-xs font-bold"
                >
                  <Phone className="w-4 h-4" /> Call
                </a>
                <a
                  href={`https://wa.me/91${selectedPartner.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1 text-xs font-bold"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onRemovePartner(selectedPartner.uid);
                    popPage();
                  }}
                  className="flex flex-col items-center gap-1 text-xs font-bold text-red-200 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPartnerDetailTab('mine')}
                className={`p-3.5 rounded-2xl bg-[var(--card)] border text-left cursor-pointer ${
                  partnerDetailTab === 'mine' ? 'border-[#101C35]' : 'border-[var(--sep2)]'
                }`}
              >
                <div className="text-lg font-extrabold tabular-nums">
                  {properties.filter((p) => p.sharedWith?.includes(selectedPartner.uid)).length}
                </div>
                <div className="text-xs font-bold text-[#101C35] dark:text-[#27C6A0]">Shared By You</div>
              </button>
              <button
                type="button"
                onClick={() => setPartnerDetailTab('theirs')}
                className={`p-3.5 rounded-2xl bg-[var(--card)] border text-left cursor-pointer ${
                  partnerDetailTab === 'theirs' ? 'border-[#27C6A0]' : 'border-[var(--sep2)]'
                }`}
              >
                <div className="text-lg font-extrabold tabular-nums">
                  {networkProps.filter((np) => np.brokerId === selectedPartner.uid).length}
                </div>
                <div className="text-xs font-bold text-[#27C6A0]">Their Properties</div>
              </button>
            </div>

            <div className="space-y-2.5">
              {partnerDetailTab === 'theirs'
                ? networkProps
                    .filter((np) => np.brokerId === selectedPartner.uid)
                    .map((np) => (
                      <div
                        key={np.id}
                        className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-sm font-bold">{np.title}</div>
                          <div className="text-xs text-[var(--label3)]">{np.location}</div>
                        </div>
                        <div className="text-sm font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums">
                          {formatINR(np.price)}
                        </div>
                      </div>
                    ))
                : properties
                    .filter((p) => p.sharedWith?.includes(selectedPartner.uid))
                    .map((p) => (
                      <div
                        key={p.id}
                        className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-sm font-bold">{p.name}</div>
                          <div className="text-xs text-[var(--label3)]">{p.location}</div>
                        </div>
                        <div className="text-sm font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums">
                          {formatINR(p.price)}
                        </div>
                      </div>
                    ))}
            </div>
          </div>
        )}

        {/* ═══ SUBPAGE 8: REQUIREMENTS & AUTO-MATCH ═══ */}
        {currentPage === 'reqs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--card)] border border-[var(--sep2)] flex-1">
                <button
                  type="button"
                  onClick={() => setReqsTab('match')}
                  className={`py-2 rounded-lg text-xs font-extrabold cursor-pointer ${
                    reqsTab === 'match' ? 'bg-[#101C35] text-white' : 'text-[var(--label3)]'
                  }`}
                >
                  Auto Matches ({matches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReqsTab('reqs')}
                  className={`py-2 rounded-lg text-xs font-extrabold cursor-pointer ${
                    reqsTab === 'reqs' ? 'bg-[#101C35] text-white' : 'text-[var(--label3)]'
                  }`}
                >
                  Requirements ({requirements.length})
                </button>
              </div>
              <button
                type="button"
                onClick={() => setAddReqOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-[#27C6A0] text-[#101C35] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Req
              </button>
            </div>

            {reqsTab === 'match' ? (
              <div className="space-y-3">
                {matches.map((m, i) => (
                  <div
                    key={`${m.requirement.id}-${m.property.id}-${i}`}
                    className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-extrabold ${
                          m.strength === 'Strong'
                            ? 'text-[#27C6A0]'
                            : m.strength === 'Good'
                              ? 'text-[#101C35] dark:text-[#27C6A0]'
                              : 'text-[#ff9500]'
                        }`}
                      >
                        {m.strength} Match · {m.score}%
                      </span>
                      <span className="text-xs font-semibold text-[var(--label3)]">
                        {m.reasons.join(' · ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-[#27C6A0]/12 border border-[#27C6A0]/30">
                        <div className="font-bold text-[#101C35] dark:text-[#27C6A0]">Client Requirement</div>
                        <div className="font-extrabold text-sm mt-0.5">
                          {m.requirement.clientName}
                        </div>
                        <div className="text-[var(--label3)]">
                          {PROP_TYPE_META[m.requirement.propType].label} ·{' '}
                          {m.requirement.location} · Max {formatINR(m.requirement.budget)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#101C35]/8 border border-[#101C35]/20 dark:border-white/15">
                        <div className="font-bold text-[#101C35] dark:text-[#27C6A0]">Matched Property</div>
                        <div className="font-extrabold text-sm mt-0.5">{m.property.name}</div>
                        <div className="text-[var(--label3)]">
                          {m.property.location} · {formatINR(m.property.price)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onSharePropWA(m.property)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Send Match on WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {requirements.map((r) => (
                  <div
                    key={r.id}
                    className="bg-[var(--card)] border border-[var(--sep2)] rounded-2xl p-4 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#27C6A0]">
                        {PROP_TYPE_META[r.propType].emoji} {PROP_TYPE_META[r.propType].label} ·{' '}
                        {r.category === 'sale' ? 'Buy' : 'Rent'}
                      </div>
                      <div className="font-display text-base font-extrabold">{r.clientName}</div>
                      <div className="text-xs text-[var(--label3)] mt-0.5">
                        {r.location} {r.notes ? `· ${r.notes}` : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums">
                        {formatINR(r.budget)}
                      </div>
                      {r.clientPhone && (
                        <div className="text-[11px] text-[var(--label3)] tabular-nums">
                          {r.clientPhone}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Net Requirement Modal */}
            {addReqOpen && (
              <div
                onClick={() => setAddReqOpen(false)}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-[var(--bg)] rounded-t-3xl sm:rounded-3xl p-5 space-y-3 animate-sheet-up"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-extrabold">Client Requirement</h3>
                    <button
                      type="button"
                      onClick={() => setAddReqOpen(false)}
                      className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      value={rnName}
                      onChange={(e) => setRnName(e.target.value)}
                      placeholder="Client Name"
                      className="px-3.5 py-3 rounded-xl bg-[var(--card)] text-sm font-semibold outline-none"
                    />
                    <input
                      value={rnPhone}
                      onChange={(e) => setRnPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Mobile"
                      maxLength={10}
                      className="px-3.5 py-3 rounded-xl bg-[var(--card)] text-sm font-semibold outline-none tabular-nums"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <select
                      value={rnCat}
                      onChange={(e) => setRnCat(e.target.value as PropertyPurpose)}
                      className="px-3.5 py-3 rounded-xl bg-[var(--card)] text-sm font-semibold outline-none"
                    >
                      <option value="sale">Sale</option>
                      <option value="rent">Rent</option>
                    </select>
                    <select
                      value={rnType}
                      onChange={(e) => setRnType(e.target.value as PropertyType)}
                      className="px-3.5 py-3 rounded-xl bg-[var(--card)] text-sm font-semibold outline-none"
                    >
                      <option value="flat">Flat</option>
                      <option value="house">House</option>
                      <option value="plot">Plot</option>
                      <option value="shop">Shop</option>
                      <option value="office">Office</option>
                    </select>
                  </div>
                  <input
                    value={rnLoc}
                    onChange={(e) => setRnLoc(e.target.value)}
                    placeholder="Preferred Location (e.g. Vijay Nagar)"
                    className="w-full px-3.5 py-3 rounded-xl bg-[var(--card)] text-sm font-semibold outline-none"
                  />
                  <input
                    type="number"
                    value={rnBudget}
                    onChange={(e) => setRnBudget(e.target.value)}
                    placeholder="Max Budget (₹)"
                    className="w-full px-3.5 py-3 rounded-xl bg-[var(--card)] text-sm font-semibold outline-none tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onAddRequirement({
                        clientName: rnName.trim() || 'Client',
                        clientPhone: rnPhone,
                        category: rnCat,
                        propType: rnType,
                        location: rnLoc.trim() || 'Indore',
                        budget: parseFloat(rnBudget) || 5000000,
                        shareOnNetwork: true,
                      });
                      setAddReqOpen(false);
                      setReqsTab('match');
                    }}
                    className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #101C35, #27C6A0)' }}
                  >
                    Save Requirement
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SUBPAGE 9: REAL ESTATE BROKER TOOLS (Rate Calc, Unit Converter, Loan EMI) ═══ */}
        {currentPage === 'tools' && (
          <div className="bg-[var(--card)] border border-[var(--sep2)] rounded-3xl overflow-hidden divide-y divide-[var(--sep2)]">
            {/* Rate Calculator */}
            <div>
              <button
                type="button"
                onClick={() => setOpenTool(openTool === 'rate' ? null : 'rate')}
                className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="font-display text-base font-extrabold">Rate Calculator</span>
                <ChevronRight
                  className={`w-4 h-4 text-[var(--label3)] transition-transform ${
                    openTool === 'rate' ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {openTool === 'rate' && (
                <div className="px-5 pb-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[var(--label3)]">Area (sq.ft)</label>
                      <input
                        type="number"
                        value={rcArea}
                        onChange={(e) => {
                          setRcArea(e.target.value);
                          const a = parseFloat(e.target.value) || 0;
                          const r = parseFloat(rcRate) || 0;
                          if (a && r) setRcTotal(String(Math.round(a * r)));
                        }}
                        className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--fill3)] font-bold tabular-nums outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[var(--label3)]">
                        Rate (₹ / sq.ft)
                      </label>
                      <input
                        type="number"
                        value={rcRate}
                        onChange={(e) => {
                          setRcRate(e.target.value);
                          const a = parseFloat(rcArea) || 0;
                          const r = parseFloat(e.target.value) || 0;
                          if (a && r) setRcTotal(String(Math.round(a * r)));
                        }}
                        className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--fill3)] font-bold tabular-nums outline-none"
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#101C35]/10 dark:bg-white/10">
                    <div className="text-[11px] font-bold uppercase text-[#101C35] dark:text-[#27C6A0]">
                      Total Price (₹)
                    </div>
                    <input
                      type="number"
                      value={rcTotal}
                      onChange={(e) => {
                        setRcTotal(e.target.value);
                        const a = parseFloat(rcArea) || 0;
                        const t = parseFloat(e.target.value) || 0;
                        if (a && t) setRcRate(String(Math.round(t / a)));
                      }}
                      className="w-full bg-transparent text-2xl font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums outline-none mt-0.5"
                    />
                    <div className="text-xs font-semibold text-[#101C35]/80 dark:text-[#27C6A0]/80">
                      {numToWord(rcTotal)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Unit Converter */}
            <div>
              <button
                type="button"
                onClick={() => setOpenTool(openTool === 'unit' ? null : 'unit')}
                className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="font-display text-base font-extrabold">Unit Converter</span>
                <ChevronRight
                  className={`w-4 h-4 text-[var(--label3)] transition-transform ${
                    openTool === 'unit' ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {openTool === 'unit' && (
                <div className="px-5 pb-5 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="number"
                      value={ucVal}
                      onChange={(e) => setUcVal(e.target.value)}
                      className="px-3 py-2.5 rounded-xl bg-[var(--fill3)] font-bold tabular-nums outline-none"
                    />
                    <select
                      value={ucFrom}
                      onChange={(e) => setUcFrom(e.target.value)}
                      className="px-3 py-2.5 rounded-xl bg-[var(--fill3)] text-xs font-bold outline-none"
                    >
                      <option value="sqft">Sq. Feet</option>
                      <option value="sqyard">Sq. Yard (Gaj)</option>
                      <option value="sqm">Sq. Meter</option>
                      <option value="acre">Acre</option>
                      <option value="hectare">Hectare</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#27C6A0]/15 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-[#101C35] dark:text-[#27C6A0]">Result</div>
                      <div className="text-2xl font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums">
                        {ucResult}
                      </div>
                    </div>
                    <select
                      value={ucTo}
                      onChange={(e) => setUcTo(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#27C6A0]/25 text-[#101C35] dark:text-[#27C6A0] text-xs font-bold outline-none"
                    >
                      <option value="sqft">Sq. Feet</option>
                      <option value="sqyard">Sq. Yard (Gaj)</option>
                      <option value="sqm">Sq. Meter</option>
                      <option value="acre">Acre</option>
                      <option value="hectare">Hectare</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Loan EMI Calculator */}
            <div>
              <button
                type="button"
                onClick={() => setOpenTool(openTool === 'loan' ? null : 'loan')}
                className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="font-display text-base font-extrabold">Loan EMI Calculator</span>
                <ChevronRight
                  className={`w-4 h-4 text-[var(--label3)] transition-transform ${
                    openTool === 'loan' ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {openTool === 'loan' && (
                <div className="px-5 pb-5 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--label3)]">
                      Loan Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={loanPrincipal}
                      onChange={(e) => setLoanPrincipal(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--fill3)] font-bold tabular-nums outline-none"
                    />
                    <div className="text-xs text-[var(--label3)] mt-1">
                      {numToWord(loanPrincipal)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[var(--label3)]">
                        Interest (% p.a.)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={loanRate}
                        onChange={(e) => setLoanRate(e.target.value)}
                        className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--fill3)] font-bold tabular-nums outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[var(--label3)]">
                        Tenure (Years)
                      </label>
                      <input
                        type="number"
                        value={loanYears}
                        onChange={(e) => setLoanYears(e.target.value)}
                        className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--fill3)] font-bold tabular-nums outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-3 rounded-xl bg-[#27C6A0]/15 text-center">
                      <div className="text-[10px] font-bold uppercase text-[#101C35] dark:text-[#27C6A0]">
                        Monthly EMI
                      </div>
                      <div className="text-sm font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums mt-0.5">
                        {formatINR(emiStats.emi)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--fill3)] text-center">
                      <div className="text-[10px] font-bold uppercase text-[var(--label3)]">
                        Interest
                      </div>
                      <div className="text-sm font-black tabular-nums mt-0.5">
                        {formatINR(emiStats.interest)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--fill3)] text-center">
                      <div className="text-[10px] font-bold uppercase text-[var(--label3)]">
                        Total Pay
                      </div>
                      <div className="text-sm font-black tabular-nums mt-0.5">
                        {formatINR(emiStats.total)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
