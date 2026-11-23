import React, { useEffect, useMemo, useState } from 'react';
import { Compass, Layers, X } from 'lucide-react';
import type {
  BrokerProfile,
  ConnectionRequest,
  Deal,
  DealStage,
  Lead,
  MainTabFilter,
  NetworkProperty,
  NetworkSubPage,
  NotificationItem,
  Property,
  Requirement,
} from './types/crm';
import { createInitialSeedData, DONB_SUGGESTED_BROKERS } from './data/seedData';
import { todayStr, shiftDateStr } from './utils/crmHelpers';
import { OnboardingFlow } from './components/OnboardingFlow';
import { SpotlightTour } from './components/SpotlightTour';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { TodayWorkspace } from './components/TodayWorkspace';
import { BottomNavBar } from './components/BottomNavBar';
import { PropertiesPage } from './components/PropertiesPage';
import { PipelinePage } from './components/PipelinePage';
import { NetworkPage } from './components/NetworkPage';
import { ProfilePage } from './components/ProfilePage';
import { TutorialsPage } from './components/TutorialsPage';
import {
  CalendarModal,
  GlobalSearchModal,
  ImportLeadsModal,
  LeadEditModal,
  NotificationsModal,
  PostCallModal,
  TrashModal,
  WhatsAppModal,
} from './components/CrmModals';

const STORAGE_KEY = 'dotcrm_react_state_v1';

interface AppState {
  profile: BrokerProfile;
  properties: Property[];
  leads: Lead[];
  requirements: Requirement[];
  deals: Deal[];
  partnerIds: string[];
  networkProps: NetworkProperty[];
  requests: ConnectionRequest[];
  notifications: NotificationItem[];
  hasCompletedOnboarding: boolean;
  fontSizeStep: number;
  darkMode: boolean;
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      if (parsed.profile && parsed.properties && parsed.leads) {
        const seed = createInitialSeedData();
        return {
          ...seed,
          ...parsed,
          hasCompletedOnboarding: parsed.hasCompletedOnboarding ?? false,
          fontSizeStep: parsed.fontSizeStep ?? 5,
          darkMode: parsed.darkMode ?? false,
        };
      }
    }
  } catch {
    // ignore corrupted storage
  }
  const seed = createInitialSeedData();
  return {
    ...seed,
    hasCompletedOnboarding: false,
    fontSizeStep: 5,
    darkMode: false,
  };
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadInitialState());

  // Navigation & Slide States
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !state.hasCompletedOnboarding
  );
  const [onboardingSlide, setOnboardingSlide] = useState<number>(1);
  const [activeView, setActiveView] = useState<
    'today' | 'props' | 'pipeline' | 'network' | 'profile' | 'tutorials'
  >('today');
  const [networkInitialSubPage, setNetworkInitialSubPage] = useState<NetworkSubPage>('home');
  const [pipelineInitialStage, setPipelineInitialStage] = useState<DealStage>('svdone');
  const [openAddPropOnMount, setOpenAddPropOnMount] = useState(false);

  // Filters & Date
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [tabFilter, setTabFilter] = useState<MainTabFilter>('all');
  const [propFilterId, setPropFilterId] = useState<string>('');

  // Overlays & Modals
  const [showTour, setShowTour] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);

  // Action Targets
  const [leadModalTarget, setLeadModalTarget] = useState<{ open: boolean; lead: Lead | null }>({
    open: false,
    lead: null,
  });
  const [postCallLead, setPostCallLead] = useState<Lead | null>(null);
  const [quickMoveLead, setQuickMoveLead] = useState<Lead | null>(null);
  const [waState, setWaState] = useState<{
    open: boolean;
    lead?: Lead | null;
    property?: Property | null;
    variant?: string;
    batchProps?: Property[];
  }>({ open: false });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);

  useEffect(() => {
    const scaleMap = [13, 14, 15, 16, 17, 18, 19, 20, 21];
    document.documentElement.style.fontSize = `${scaleMap[(state.fontSizeStep || 5) - 1] || 17}px`;
  }, [state.fontSizeStep]);

  const unreadNotifCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications]
  );

  const pipelineCount = useMemo(
    () => state.deals.filter((d) => !d.isLeakage && d.stage !== 'full').length,
    [state.deals]
  );

  // State Mutators
  const updateProfile = (patch: Partial<BrokerProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch },
    }));
  };

  const toggleConnectBroker = (uid: string) => {
    setState((prev) => {
      const exists = prev.partnerIds.includes(uid);
      return {
        ...prev,
        partnerIds: exists
          ? prev.partnerIds.filter((id) => id !== uid)
          : [...prev.partnerIds, uid],
      };
    });
  };

  const saveRequirement = (reqData: Omit<Requirement, 'id' | 'createdAt'>) => {
    const newReq: Requirement = {
      ...reqData,
      id: `req_${Date.now()}`,
      createdAt: todayStr(),
    };
    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      name: reqData.clientName,
      phone: reqData.clientPhone || '',
      leadDate: todayStr(),
      type: 'requirement',
      budget: reqData.budget ? `₹${Math.round(reqData.budget / 100000)}L` : undefined,
      todayTalk: `${reqData.propType} in ${reqData.location}`,
      isRequirementLead: true,
      createdAt: todayStr(),
    };
    setState((prev) => ({
      ...prev,
      requirements: [newReq, ...prev.requirements],
      leads: [newLead, ...prev.leads],
    }));
  };

  const saveProperty = (propData: Omit<Property, 'id' | 'createdAt'>, existingId?: string) => {
    setState((prev) => {
      if (existingId) {
        return {
          ...prev,
          properties: prev.properties.map((p) =>
            p.id === existingId ? { ...p, ...propData } : p
          ),
        };
      }
      const created: Property = {
        ...propData,
        id: `prop_${Date.now()}`,
        createdAt: todayStr(),
      };
      return { ...prev, properties: [created, ...prev.properties] };
    });
  };

  const saveLead = (leadData: Omit<Lead, 'id' | 'createdAt'>, existingId?: string) => {
    setState((prev) => {
      if (existingId) {
        return {
          ...prev,
          leads: prev.leads.map((l) => (l.id === existingId ? { ...l, ...leadData } : l)),
        };
      }
      const created: Lead = {
        ...leadData,
        id: `lead_${Date.now()}`,
        createdAt: todayStr(),
      };
      return { ...prev, leads: [created, ...prev.leads] };
    });
  };

  const updateLead = (id: string, patch: Partial<Lead>) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const saveDeal = (dealData: Omit<Deal, 'id'>) => {
    const created: Deal = { ...dealData, id: `deal_${Date.now()}` };
    setState((prev) => ({ ...prev, deals: [created, ...prev.deals] }));
  };

  const handleSvDoneFromLead = (lead: Lead) => {
    const prop = state.properties.find((p) => p.id === lead.propertyId);
    saveDeal({
      stage: 'svdone',
      propertyId: prop?.id,
      propertyName: prop?.name || 'Visited Property',
      clientName: lead.name,
      clientPhone: lead.phone,
      dealValue: prop?.price || 5000000,
      commPct: prop?.commPct || 2,
      commAmount: Math.round(((prop?.price || 5000000) * (prop?.commPct || 2)) / 100),
      dealDate: todayStr(),
      reaction: 'hot',
      notes: lead.todayTalk,
    });
    updateLead(lead.id, { inPipeline: true, type: 'plfollow' });
    setPipelineInitialStage('svdone');
    setActiveView('pipeline');
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digitalcrm-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.leads && parsed.properties) {
          setState((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // ignore invalid JSON
      }
    };
    reader.readAsText(file);
  };

  const openSlides = (slide = 1) => {
    setOnboardingSlide(slide);
    setShowOnboarding(true);
    setShowNavigator(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--label)]">
      {/* Subtle Slide & Page Explorer Button (lets user inspect EVERY slide & page directly) */}
      {!showOnboarding && (
        <button
          type="button"
          onClick={() => setShowNavigator(true)}
          className="fixed bottom-24 left-4 z-40 px-3.5 py-2 rounded-full bg-[var(--card)]/95 backdrop-blur-md border border-[var(--sep2)] shadow-lg text-xs font-extrabold text-[var(--label)] flex items-center gap-1.5 hover:bg-[var(--fill3)] cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-[#27C6A0]" />
          All Pages &amp; Slides
        </button>
      )}

      {/* 8-Slide Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          initialSlide={onboardingSlide}
          profile={state.profile}
          connectedPartnerIds={state.partnerIds}
          onUpdateProfile={updateProfile}
          onToggleConnectBroker={toggleConnectBroker}
          onSaveRequirement={saveRequirement}
          onFinish={(action) => {
            setState((prev) => ({ ...prev, hasCompletedOnboarding: true }));
            setShowOnboarding(false);
            if (action === 'prop') {
              setOpenAddPropOnMount(true);
              setActiveView('props');
            } else if (action === 'lead') {
              setActiveView('today');
              setLeadModalTarget({ open: true, lead: null });
            } else if (action === 'tour') {
              setActiveView('today');
              setShowTour(true);
            } else {
              setActiveView('today');
            }
          }}
        />
      )}

      {/* Main Active Screen */}
      {!showOnboarding && activeView === 'today' && (
        <TodayWorkspace
          profile={state.profile}
          selectedDate={selectedDate}
          onShiftDate={(d) => setSelectedDate((s) => shiftDateStr(s, d))}
          onOpenCalendar={() => setShowCalendar(true)}
          leads={state.leads}
          properties={state.properties}
          deals={state.deals}
          unreadNotifCount={unreadNotifCount}
          tabFilter={tabFilter}
          onSetTabFilter={setTabFilter}
          propFilterId={propFilterId}
          onSetPropFilterId={setPropFilterId}
          onOpenTutorials={() => setActiveView('tutorials')}
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenProfile={() => setActiveView('profile')}
          onOpenSearch={() => setShowSearch(true)}
          onOpenDeals={(stage = 'svdone') => {
            setPipelineInitialStage(stage);
            setActiveView('pipeline');
          }}
          onOpenRequirements={() => {
            setNetworkInitialSubPage('reqs');
            setActiveView('network');
          }}
          onCallLead={(l) => setPostCallLead(l)}
          onWhatsAppLead={(l) =>
            setWaState({
              open: true,
              lead: l,
              property: state.properties.find((p) => p.id === l.propertyId) || state.properties[0],
              variant: l.variantLabel,
            })
          }
          onQuickMoveLead={(l) => setQuickMoveLead(l)}
          onSvDoneLead={handleSvDoneFromLead}
          onEditLead={(l) => setLeadModalTarget({ open: true, lead: l })}
          onTrashLead={(l) => updateLead(l.id, { type: 'trash' })}
          onAddLead={() => setLeadModalTarget({ open: true, lead: null })}
          onOpenImport={() => setShowImport(true)}
          onOpenContacts={() => setLeadModalTarget({ open: true, lead: null })}
          onOpenBriefing={() => setShowBriefing(true)}
        />
      )}

      {!showOnboarding && activeView === 'props' && (
        <PropertiesPage
          properties={state.properties}
          openAddImmediately={openAddPropOnMount}
          onClose={() => {
            setOpenAddPropOnMount(false);
            setActiveView('today');
          }}
          onSaveProperty={saveProperty}
          onDeleteProperty={(id) =>
            setState((prev) => ({
              ...prev,
              properties: prev.properties.filter((p) => p.id !== id),
            }))
          }
          onToggleSoldOut={(id) =>
            setState((prev) => ({
              ...prev,
              properties: prev.properties.map((p) =>
                p.id === id ? { ...p, isSoldOut: !p.isSoldOut } : p
              ),
            }))
          }
          onSharePropertyWA={(p, variant) =>
            setWaState({ open: true, property: p, variant })
          }
          onBatchShareWA={(props) => setWaState({ open: true, batchProps: props })}
        />
      )}

      {!showOnboarding && activeView === 'pipeline' && (
        <PipelinePage
          deals={state.deals}
          properties={state.properties}
          leads={state.leads}
          initialStage={pipelineInitialStage}
          onClose={() => setActiveView('today')}
          onSaveDeal={saveDeal}
          onAdvanceDealStage={(id, nextStage) =>
            setState((prev) => ({
              ...prev,
              deals: prev.deals.map((d) => (d.id === id ? { ...d, stage: nextStage } : d)),
            }))
          }
          onToggleInstallment={(dealId, instId) =>
            setState((prev) => ({
              ...prev,
              deals: prev.deals.map((d) =>
                d.id === dealId
                  ? {
                      ...d,
                      installments: d.installments?.map((ins) =>
                        ins.id === instId ? { ...ins, paid: !ins.paid } : ins
                      ),
                    }
                  : d
              ),
            }))
          }
          onMarkLeakage={(id) =>
            setState((prev) => ({
              ...prev,
              deals: prev.deals.map((d) => (d.id === id ? { ...d, isLeakage: true } : d)),
            }))
          }
        />
      )}

      {!showOnboarding && activeView === 'network' && (
        <NetworkPage
          key={networkInitialSubPage}
          profile={state.profile}
          properties={state.properties}
          partnerIds={state.partnerIds}
          networkProps={state.networkProps}
          requests={state.requests}
          requirements={state.requirements}
          initialSubPage={networkInitialSubPage}
          onClose={() => setActiveView('today')}
          onSendRequest={(b) =>
            setState((prev) => ({
              ...prev,
              requests: [
                {
                  id: `req_conn_${Date.now()}`,
                  brokerId: b.uid,
                  brokerName: b.name,
                  brokerCity: b.city,
                  workIn: b.workIn,
                  direction: 'sent',
                  createdAt: todayStr(),
                },
                ...prev.requests,
              ],
            }))
          }
          onAcceptRequest={(reqId) =>
            setState((prev) => {
              const req = prev.requests.find((r) => r.id === reqId);
              return {
                ...prev,
                partnerIds: req
                  ? Array.from(new Set([...prev.partnerIds, req.brokerId]))
                  : prev.partnerIds,
                requests: prev.requests.filter((r) => r.id !== reqId),
              };
            })
          }
          onDeclineRequest={(reqId) =>
            setState((prev) => ({
              ...prev,
              requests: prev.requests.filter((r) => r.id !== reqId),
            }))
          }
          onRemovePartner={(uid) =>
            setState((prev) => ({
              ...prev,
              partnerIds: prev.partnerIds.filter((id) => id !== uid),
            }))
          }
          onToggleSharePropWithPartner={(propId, partnerUid) =>
            setState((prev) => ({
              ...prev,
              properties: prev.properties.map((p) => {
                if (p.id !== propId) return p;
                const cur = p.sharedWith || [];
                return {
                  ...p,
                  sharedWith: cur.includes(partnerUid)
                    ? cur.filter((x) => x !== partnerUid)
                    : [...cur, partnerUid],
                };
              }),
            }))
          }
          onAddRequirement={saveRequirement}
          onSharePropWA={(p) => setWaState({ open: true, property: p })}
        />
      )}

      {!showOnboarding && activeView === 'profile' && (
        <ProfilePage
          profile={state.profile}
          leads={state.leads}
          properties={state.properties}
          deals={state.deals}
          fontSizeStep={state.fontSizeStep}
          darkMode={state.darkMode}
          onSetFontSizeStep={(step) => setState((prev) => ({ ...prev, fontSizeStep: step }))}
          onToggleDarkMode={() => setState((prev) => ({ ...prev, darkMode: !prev.darkMode }))}
          onUpdateProfile={updateProfile}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onOpenTrash={() => setShowTrash(true)}
          onOpenOnboarding={(slide = 1) => openSlides(slide)}
          onOpenTour={() => {
            setActiveView('today');
            setShowTour(true);
          }}
          onClose={() => setActiveView('today')}
        />
      )}

      {!showOnboarding && activeView === 'tutorials' && (
        <TutorialsPage
          onClose={() => setActiveView('today')}
          onOpenOnboarding={(slide = 1) => openSlides(slide)}
        />
      )}

      {/* Dual-Island Floating Bottom Tab Bar */}
      {!showOnboarding && (
        <BottomNavBar
          activeView={
            activeView === 'pipeline'
              ? 'pipeline'
              : activeView === 'props'
                ? 'props'
                : activeView === 'network'
                  ? 'network'
                  : 'today'
          }
          pipelineCount={pipelineCount}
          onSelectToday={() => setActiveView('today')}
          onQuickFilterFromCall={(filter) => {
            setTabFilter(filter);
            setActiveView('today');
          }}
          onOpenPipeline={() => {
            setPipelineInitialStage('svdone');
            setActiveView('pipeline');
          }}
          onOpenProps={() => {
            setOpenAddPropOnMount(false);
            setActiveView('props');
          }}
          onOpenNetwork={() => {
            setNetworkInitialSubPage('home');
            setActiveView('network');
          }}
        />
      )}

      {/* Overlays & Modals */}
      {showTour && (
        <SpotlightTour
          onClose={() => setShowTour(false)}
          onNavigateTarget={(target) => setActiveView(target)}
        />
      )}

      {showBriefing && (
        <DailyBriefingModal
          profile={state.profile}
          leads={state.leads}
          properties={state.properties}
          deals={state.deals}
          onClose={() => setShowBriefing(false)}
        />
      )}

      {leadModalTarget.open && (
        <LeadEditModal
          lead={leadModalTarget.lead}
          defaultDate={selectedDate}
          properties={state.properties}
          onSave={saveLead}
          onClose={() => setLeadModalTarget({ open: false, lead: null })}
        />
      )}

      {postCallLead && (
        <PostCallModal
          lead={postCallLead}
          properties={state.properties}
          onUpdateLead={updateLead}
          onClose={() => setPostCallLead(null)}
        />
      )}

      {quickMoveLead && (
        <div
          onClick={() => setQuickMoveLead(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[var(--card)] rounded-t-3xl sm:rounded-3xl p-5 space-y-2.5 animate-sheet-up"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-base font-extrabold">
                Move {quickMoveLead.name}
              </h3>
              <button
                type="button"
                onClick={() => setQuickMoveLead(null)}
                className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {(
              [
                { k: 'follow', l: 'Follow-up' },
                { k: 'visit', l: 'Site Visit' },
                { k: 'reschedule', l: 'Reschedule' },
                { k: 'npu', l: 'Not Picked Up' },
                { k: 'requirement', l: 'Requirement' },
                { k: 'trash', l: 'Move to Trash' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.k}
                type="button"
                onClick={() => {
                  updateLead(quickMoveLead.id, { type: opt.k, leadDate: todayStr() });
                  setQuickMoveLead(null);
                }}
                className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold cursor-pointer ${
                  opt.k === 'trash'
                    ? 'bg-[#ff3b30]/10 text-[#ff3b30]'
                    : 'bg-[var(--fill3)] hover:bg-[var(--fill2)]'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {waState.open && (
        <WhatsAppModal
          profile={state.profile}
          lead={waState.lead}
          properties={state.properties}
          initialProperty={waState.property}
          initialVariant={waState.variant}
          batchProps={waState.batchProps}
          onSent={(leadId) => {
            if (leadId) {
              const l = state.leads.find((x) => x.id === leadId);
              if (l) updateLead(leadId, { waCount: (l.waCount || 0) + 1 });
            }
          }}
          onClose={() => setWaState({ open: false })}
        />
      )}

      {showCalendar && (
        <CalendarModal
          selectedDate={selectedDate}
          leads={state.leads}
          onSelectDate={(ds) => {
            setSelectedDate(ds);
            setTabFilter('all');
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {showImport && (
        <ImportLeadsModal
          onImport={(items) => {
            const td = todayStr();
            const created: Lead[] = items.map((it, idx) => ({
              id: `lead_imp_${Date.now()}_${idx}`,
              name: it.name,
              phone: it.phone,
              leadDate: td,
              type: 'new',
              createdAt: td,
            }));
            setState((prev) => ({ ...prev, leads: [...created, ...prev.leads] }));
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {showNotifications && (
        <NotificationsModal
          notifications={state.notifications}
          onClearAll={() => setState((prev) => ({ ...prev, notifications: [] }))}
          onMarkRead={(id) =>
            setState((prev) => ({
              ...prev,
              notifications: prev.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
            }))
          }
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showTrash && (
        <TrashModal
          trashedLeads={state.leads.filter((l) => l.type === 'trash')}
          onRestore={(id) => updateLead(id, { type: 'new' })}
          onPermanentDelete={(id) =>
            setState((prev) => ({
              ...prev,
              leads: prev.leads.filter((l) => l.id !== id),
            }))
          }
          onEmptyTrash={() =>
            setState((prev) => ({
              ...prev,
              leads: prev.leads.filter((l) => l.type !== 'trash'),
            }))
          }
          onClose={() => setShowTrash(false)}
        />
      )}

      {showSearch && (
        <GlobalSearchModal
          leads={state.leads}
          properties={state.properties}
          onSelectLead={(l) => setLeadModalTarget({ open: true, lead: l })}
          onSelectProperty={() => setActiveView('props')}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* All Pages & Slides Quick Navigator */}
      {showNavigator && (
        <div
          onClick={() => setShowNavigator(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[var(--bg)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[88vh] overflow-y-auto space-y-5 animate-sheet-up"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-extrabold">
                  Digital CRM — Every Page &amp; Slide
                </h3>
                <p className="text-xs text-[var(--label3)]">
                  Jump directly to any onboarding slide, screen, or modal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNavigator(false)}
                className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--label3)] mb-2">
                Onboarding Slides (1–8)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  '1. Welcome',
                  '2. Pain Points',
                  '3. Profile',
                  '4. Greeting',
                  '5. City',
                  '6. Requirement',
                  '7. Network',
                  '8. Ready',
                ].map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => openSlides(idx + 1)}
                    className="py-2.5 px-3 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-bold text-left hover:border-[#101C35] cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--label3)] mb-2">
                Core CRM Screens &amp; Overlays
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Today Dashboard', fn: () => setActiveView('today') },
                  {
                    label: 'Daily Briefing',
                    fn: () => {
                      setActiveView('today');
                      setShowBriefing(true);
                    },
                  },
                  {
                    label: 'Spotlight Tour',
                    fn: () => {
                      setActiveView('today');
                      setShowTour(true);
                    },
                  },
                  {
                    label: 'My Properties',
                    fn: () => {
                      setOpenAddPropOnMount(false);
                      setActiveView('props');
                    },
                  },
                  {
                    label: 'Smart Paste Add Prop',
                    fn: () => {
                      setOpenAddPropOnMount(true);
                      setActiveView('props');
                    },
                  },
                  {
                    label: 'Pipeline & Deals',
                    fn: () => {
                      setPipelineInitialStage('svdone');
                      setActiveView('pipeline');
                    },
                  },
                  { label: 'Profile & Backup', fn: () => setActiveView('profile') },
                  { label: 'Guides & Tutorials', fn: () => setActiveView('tutorials') },
                  { label: 'Calendar View', fn: () => setShowCalendar(true) },
                  { label: 'Import Leads', fn: () => setShowImport(true) },
                  {
                    label: 'WhatsApp Composer',
                    fn: () =>
                      setWaState({ open: true, property: state.properties[0] }),
                  },
                  { label: 'Trash & Leakage', fn: () => setShowTrash(true) },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setShowNavigator(false);
                      item.fn();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-bold text-left hover:border-[#101C35] cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--label3)] mb-2">
                Broker Network Subpages &amp; Tools
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    { label: 'Network Home + ID Card', sub: 'home' },
                    { label: 'Find Brokers (Discover)', sub: 'discover' },
                    { label: 'My Partners', sub: 'partners' },
                    { label: 'Pending Requests', sub: 'pending' },
                    { label: 'My Shared Props', sub: 'myprops' },
                    { label: 'Partner Properties', sub: 'partnerprops' },
                    { label: 'Reqs & Auto-Match', sub: 'reqs' },
                    { label: 'Broker Tools (EMI/Calc)', sub: 'tools' },
                  ] as { label: string; sub: NetworkSubPage }[]
                ).map((item) => (
                  <button
                    key={item.sub}
                    type="button"
                    onClick={() => {
                      setShowNavigator(false);
                      setNetworkInitialSubPage(item.sub);
                      setActiveView('network');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[var(--card)] border border-[var(--sep2)] text-xs font-bold text-left hover:border-[#27C6A0] cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--sep2)] flex items-center justify-between text-xs text-[var(--label3)]">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                {DONB_SUGGESTED_BROKERS.length} verified Indore brokers loaded
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  const fresh = createInitialSeedData();
                  setState({
                    ...fresh,
                    hasCompletedOnboarding: false,
                    fontSizeStep: 5,
                    darkMode: false,
                  });
                  setShowNavigator(false);
                  openSlides(1);
                }}
                className="font-bold text-[#ff3b30] cursor-pointer"
              >
                Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
