import React, { useMemo, useState } from 'react';
import { ArrowLeft, Flame, Plus, Snowflake, Trash2, X } from 'lucide-react';
import type { Deal, DealInstallment, DealStage, Lead, Property } from '../types/crm';
import { formatINR, formatShortDate, numToWord, todayStr } from '../utils/crmHelpers';

interface PipelinePageProps {
  deals: Deal[];
  properties: Property[];
  leads: Lead[];
  initialStage?: DealStage;
  onClose: () => void;
  onSaveDeal: (deal: Omit<Deal, 'id'>) => void;
  onAdvanceDealStage: (id: string, nextStage: DealStage) => void;
  onToggleInstallment: (dealId: string, instId: string) => void;
  onMarkLeakage: (id: string) => void;
}

export const PipelinePage: React.FC<PipelinePageProps> = ({
  deals,
  properties,
  leads,
  initialStage = 'svdone',
  onClose,
  onSaveDeal,
  onAdvanceDealStage,
  onToggleInstallment,
  onMarkLeakage,
}) => {
  const [activeTab, setActiveTab] = useState<DealStage>(initialStage);
  const [addOpen, setAddOpen] = useState(false);

  // Add Deal Modal State
  const [mode, setMode] = useState<DealStage>(initialStage);
  const [propId, setPropId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [commPct, setCommPct] = useState('2');
  const [dealDate, setDealDate] = useState(todayStr());
  const [notes, setNotes] = useState('');

  // Token specifics
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenPayMode, setTokenPayMode] = useState<'cash' | 'cheque' | 'online'>('online');
  const [tokenRefundable, setTokenRefundable] = useState(false);
  const [installments, setInstallments] = useState<DealInstallment[]>([]);

  // SV Done specifics
  const [reaction, setReaction] = useState<'hot' | 'cold' | ''>('hot');
  const [clientOffer, setClientOffer] = useState('');
  const [ownerOffer, setOwnerOffer] = useState('');
  const [decisionMaker, setDecisionMaker] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'loan' | 'installment' | 'mixed' | ''>('loan');
  const [obstacle, setObstacle] = useState('');
  const [nextFollowDate, setNextFollowDate] = useState(todayStr());

  const activeDeals = useMemo(() => deals.filter((d) => !d.isLeakage), [deals]);
  const visibleDeals = useMemo(
    () => activeDeals.filter((d) => d.stage === activeTab),
    [activeDeals, activeTab]
  );

  const summary = useMemo(() => {
    const earned = activeDeals
      .filter((d) => d.stage === 'full')
      .reduce((s, d) => s + (d.commAmount || 0), 0);
    const potential = activeDeals
      .filter((d) => d.stage !== 'full')
      .reduce((s, d) => s + (d.commAmount || 0), 0);
    return { earned, potential };
  }, [activeDeals]);

  const handleSelectProp = (id: string) => {
    setPropId(id);
    const p = properties.find((x) => x.id === id);
    if (p) {
      setDealValue(String(p.price || ''));
      setCommPct(String(p.commPct || 2));
    }
  };

  const handleSelectLead = (id: string) => {
    const l = leads.find((x) => x.id === id);
    if (l) {
      setClientName(l.name);
      setClientPhone(l.phone);
      if (l.propertyId) handleSelectProp(l.propertyId);
    }
  };

  const computedComm = Math.round(((parseFloat(dealValue) || 0) * (parseFloat(commPct) || 0)) / 100);

  const handleSubmitDeal = (e: React.FormEvent) => {
    e.preventDefault();
    const p = properties.find((x) => x.id === propId);
    onSaveDeal({
      stage: mode,
      propertyId: propId || undefined,
      propertyName: p?.name || 'Custom Property',
      clientName: clientName.trim() || 'Client',
      clientPhone: clientPhone.trim() || undefined,
      dealValue: parseFloat(dealValue) || 0,
      commPct: parseFloat(commPct) || 2,
      commAmount: computedComm,
      dealDate,
      notes: notes.trim() || undefined,
      tokenAmount: mode === 'token' ? parseFloat(tokenAmount) || 0 : undefined,
      tokenPayMode: mode === 'token' ? tokenPayMode : undefined,
      tokenRefundable: mode === 'token' ? tokenRefundable : undefined,
      installments: mode === 'token' ? installments : undefined,
      reaction: mode === 'svdone' ? reaction : undefined,
      clientOffer: mode === 'svdone' ? clientOffer : undefined,
      ownerOffer: mode === 'svdone' ? ownerOffer : undefined,
      decisionMaker: mode === 'svdone' ? decisionMaker : undefined,
      payMode: mode === 'svdone' ? payMode : undefined,
      obstacle: mode === 'svdone' ? obstacle : undefined,
      nextFollowDate: mode === 'svdone' ? nextFollowDate : undefined,
    });
    setAddOpen(false);
    setActiveTab(mode);
  };

  return (
    <div className="min-h-screen pb-32 max-w-6xl mx-auto">
      <header className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-xl px-4 py-3 border-b border-[var(--sep2)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to Today"
            className="w-9 h-9 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl font-extrabold tracking-tight">₹ Pipeline</h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setMode(activeTab);
            setAddOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-[#101C35] dark:bg-[#27C6A0] text-white dark:text-[#101C35] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Mark Deal
        </button>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Commission Summary Bar */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--label3)]">
              Pipeline Potential
            </div>
            <div className="text-2xl font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums mt-0.5">
              {formatINR(summary.potential)}
            </div>
          </div>
          <div className="bg-[#27C6A0]/15 rounded-2xl border border-[#27C6A0]/35 p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#101C35] dark:text-[#27C6A0]">
              Earned Brokerage
            </div>
            <div className="text-2xl font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums mt-0.5">
              {formatINR(summary.earned)}
            </div>
          </div>
        </div>

        {/* Segment: SV Done / Token / Deal Done */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--card)] border border-[var(--sep2)]">
          {(
            [
              { key: 'svdone', label: 'SV Done' },
              { key: 'token', label: 'Token' },
              { key: 'full', label: 'Deal Done' },
            ] as const
          ).map((t) => {
            const cnt = activeDeals.filter((d) => d.stage === t.key).length;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer tabular-nums ${
                  activeTab === t.key
                    ? 'bg-[#101C35] text-white shadow-sm'
                    : 'text-[var(--label3)] hover:text-[var(--label)]'
                }`}
              >
                {t.label} ({cnt})
              </button>
            );
          })}
        </div>

        {/* Deals List */}
        {visibleDeals.length === 0 ? (
          <div className="bg-[var(--card)] rounded-3xl border border-[var(--sep2)] p-10 text-center">
            <div className="font-display text-lg font-bold mb-1">No deals in this stage</div>
            <p className="text-sm text-[var(--label3)] mb-4">
              Mark an SV Done, Token, or Closed Deal to track commission here.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode(activeTab);
                setAddOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#101C35] text-white text-xs font-bold cursor-pointer"
            >
              + Mark Deal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {visibleDeals.map((d) => (
              <div
                key={d.id}
                className="bg-[var(--card)] rounded-[22px] border border-[var(--sep2)] p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-extrabold truncate">
                        {d.clientName}
                      </h3>
                      {d.reaction === 'hot' && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#ff3b30]">
                          <Flame className="w-3.5 h-3.5" /> Hot
                        </span>
                      )}
                      {d.reaction === 'cold' && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#101C35] dark:text-[#27C6A0]">
                          <Snowflake className="w-3.5 h-3.5" /> Cold
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-[var(--label3)] mt-0.5 truncate">
                      {d.propertyName} · {formatShortDate(d.dealDate)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-[#27C6A0] tabular-nums">
                      {formatINR(d.commAmount)}
                    </div>
                    <div className="text-[11px] font-semibold text-[var(--label3)] tabular-nums">
                      {d.commPct}% of {formatINR(d.dealValue)}
                    </div>
                  </div>
                </div>

                {d.stage === 'svdone' && (
                  <div className="bg-[var(--fill3)] rounded-xl p-3 text-xs space-y-1.5">
                    {(d.clientOffer || d.ownerOffer) && (
                      <div className="flex items-center justify-between font-bold tabular-nums">
                        <span className="text-[#ff9500]">
                          Client Offer: {d.clientOffer ? formatINR(parseFloat(d.clientOffer)) : '—'}
                        </span>
                        <span className="text-[#27C6A0]">
                          Owner Offer: {d.ownerOffer ? formatINR(parseFloat(d.ownerOffer)) : '—'}
                        </span>
                      </div>
                    )}
                    {d.obstacle && (
                      <div className="text-[var(--label2)]">
                        <span className="font-bold">Obstacle:</span> {d.obstacle}
                      </div>
                    )}
                    {d.decisionMaker && (
                      <div className="text-[var(--label3)]">
                        Decision Maker: {d.decisionMaker} {d.payMode ? `· ${d.payMode}` : ''}
                      </div>
                    )}
                  </div>
                )}

                {d.stage === 'token' && (
                  <div className="bg-[#b8860b]/8 border border-[#b8860b]/20 rounded-xl p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#b8860b] tabular-nums">
                        Token Paid: {formatINR(d.tokenAmount || 0)} ({d.tokenPayMode || 'online'})
                      </span>
                      <span className="text-[var(--label3)]">
                        {d.tokenRefundable ? 'Refundable' : 'Non-Refundable'}
                      </span>
                    </div>
                    {d.installments && d.installments.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-[#b8860b]/15">
                        {d.installments.map((ins) => (
                          <label
                            key={ins.id}
                            className="flex items-center justify-between cursor-pointer py-0.5"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={ins.paid}
                                onChange={() => onToggleInstallment(d.id, ins.id)}
                                className="accent-[#27C6A0]"
                              />
                              <span className={ins.paid ? 'line-through text-[var(--label3)]' : 'font-semibold'}>
                                {formatShortDate(ins.dueDate)}
                              </span>
                            </span>
                            <span className="font-bold tabular-nums">{formatINR(ins.amount)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {d.notes && <div className="text-xs text-[var(--label3)]">{d.notes}</div>}

                <div className="pt-2.5 border-t border-[var(--sep2)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {d.stage === 'svdone' && (
                      <button
                        type="button"
                        onClick={() => onAdvanceDealStage(d.id, 'token')}
                        className="px-3 py-1.5 rounded-xl bg-[#b8860b]/15 text-[#b8860b] text-xs font-bold cursor-pointer"
                      >
                        Move to Token →
                      </button>
                    )}
                    {d.stage === 'token' && (
                      <button
                        type="button"
                        onClick={() => onAdvanceDealStage(d.id, 'full')}
                        className="px-3 py-1.5 rounded-xl bg-[#27C6A0]/20 text-[#101C35] dark:text-[#27C6A0] text-xs font-bold cursor-pointer"
                      >
                        Mark Deal Done →
                      </button>
                    )}
                  </div>

                  {d.stage !== 'full' && (
                    <button
                      type="button"
                      onClick={() => onMarkLeakage(d.id)}
                      className="px-2.5 py-1.5 rounded-xl text-[#ff3b30] hover:bg-[#ff3b30]/10 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Leakage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Deal Modal */}
      {addOpen && (
        <div
          onClick={() => setAddOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmitDeal}
            className="w-full max-w-lg bg-[var(--bg)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto space-y-4 animate-sheet-up"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">Mark Pipeline Stage</h3>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--card)] border border-[var(--sep2)]">
              {(['svdone', 'token', 'full'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    mode === m ? 'bg-[#101C35] text-white' : 'text-[var(--label3)]'
                  }`}
                >
                  {m === 'svdone' ? 'SV Done' : m === 'token' ? 'Token' : 'Deal Done'}
                </button>
              ))}
            </div>

            <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] divide-y divide-[var(--sep2)]">
              <div className="flex items-center justify-between px-4 py-3 gap-2">
                <label className="text-xs font-bold text-[var(--label3)]">Property</label>
                <select
                  value={propId}
                  onChange={(e) => handleSelectProp(e.target.value)}
                  className="text-right text-xs font-bold bg-transparent outline-none"
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between px-4 py-3 gap-2">
                <label className="text-xs font-bold text-[var(--label3)]">Link Lead</label>
                <select
                  onChange={(e) => handleSelectLead(e.target.value)}
                  className="text-right text-xs font-bold bg-transparent outline-none"
                >
                  <option value="">Choose existing client</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between px-4 py-3 gap-2">
                <label className="text-xs font-bold text-[var(--label3)]">Client Name *</label>
                <input
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client name"
                  className="text-right text-sm font-semibold bg-transparent outline-none"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3 gap-2">
                <label className="text-xs font-bold text-[var(--label3)]">Client Phone</label>
                <input
                  value={clientPhone}
                  maxLength={10}
                  onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit"
                  className="text-right text-sm font-semibold bg-transparent outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] divide-y divide-[var(--sep2)]">
              <div className="flex items-center justify-between px-4 py-3 gap-2">
                <label className="text-xs font-bold text-[var(--label3)]">Deal Value (₹)</label>
                <input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  placeholder="e.g. 6500000"
                  className="text-right text-sm font-bold text-[#101C35] dark:text-[#27C6A0] bg-transparent outline-none tabular-nums"
                />
              </div>
              {dealValue && (
                <div className="px-4 py-1.5 text-right text-xs font-bold text-[#27C6A0]">
                  {numToWord(dealValue)}
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3 gap-2">
                <label className="text-xs font-bold text-[var(--label3)]">Commission %</label>
                <input
                  type="number"
                  step="0.1"
                  value={commPct}
                  onChange={(e) => setCommPct(e.target.value)}
                  className="text-right text-sm font-bold bg-transparent outline-none tabular-nums"
                />
              </div>
              <div className="px-4 py-2 text-right text-xs font-extrabold text-[#27C6A0] tabular-nums">
                Brokerage: {formatINR(computedComm)}
              </div>
              <div className="flex items-center justify-between px-4 py-3 gap-2">
                <label className="text-xs font-bold text-[var(--label3)]">Date</label>
                <input
                  type="date"
                  value={dealDate}
                  onChange={(e) => setDealDate(e.target.value)}
                  className="text-right text-sm font-semibold bg-transparent outline-none"
                />
              </div>
            </div>

            {mode === 'token' && (
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] p-4 space-y-3">
                <div className="text-xs font-bold uppercase text-[#b8860b]">Token Payment</div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    placeholder="Token ₹"
                    className="px-3 py-2.5 rounded-xl bg-[var(--fill3)] text-sm font-bold tabular-nums outline-none"
                  />
                  <select
                    value={tokenPayMode}
                    onChange={(e) =>
                      setTokenPayMode(e.target.value as 'cash' | 'cheque' | 'online')
                    }
                    className="px-3 py-2.5 rounded-xl bg-[var(--fill3)] text-xs font-bold outline-none"
                  >
                    <option value="online">Online / UPI</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <label className="flex items-center justify-between text-xs font-bold">
                  <span>Token Refundable?</span>
                  <input
                    type="checkbox"
                    checked={tokenRefundable}
                    onChange={(e) => setTokenRefundable(e.target.checked)}
                    className="w-4 h-4 accent-[#101C35]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setInstallments((prev) => [
                      ...prev,
                      {
                        id: `ins_${Date.now()}`,
                        amount: 500000,
                        dueDate: todayStr(),
                        paid: false,
                      },
                    ])
                  }
                  className="text-xs font-bold text-[#101C35] dark:text-[#27C6A0] cursor-pointer"
                >
                  + Add Installment Schedule
                </button>
              </div>
            )}

            {mode === 'svdone' && (
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReaction('hot')}
                    className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                      reaction === 'hot'
                        ? 'bg-[#ff3b30]/15 text-[#ff3b30] border border-[#ff3b30]/40'
                        : 'bg-[var(--fill3)]'
                    }`}
                  >
                    Hot Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => setReaction('cold')}
                    className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                      reaction === 'cold'
                        ? 'bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0] border border-[#27C6A0]/40'
                        : 'bg-[var(--fill3)]'
                    }`}
                  >
                    Cold Lead
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={clientOffer}
                    onChange={(e) => setClientOffer(e.target.value)}
                    placeholder="Client Offer (₹)"
                    className="px-3 py-2.5 rounded-xl bg-[var(--fill3)] text-xs font-bold outline-none tabular-nums"
                  />
                  <input
                    value={ownerOffer}
                    onChange={(e) => setOwnerOffer(e.target.value)}
                    placeholder="Owner Offer (₹)"
                    className="px-3 py-2.5 rounded-xl bg-[var(--fill3)] text-xs font-bold outline-none tabular-nums"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={decisionMaker}
                    onChange={(e) => setDecisionMaker(e.target.value)}
                    placeholder="Decision maker (e.g. Father)"
                    className="px-3 py-2.5 rounded-xl bg-[var(--fill3)] text-xs font-semibold outline-none"
                  />
                  <select
                    value={payMode}
                    onChange={(e) =>
                      setPayMode(
                        e.target.value as 'cash' | 'loan' | 'installment' | 'mixed' | ''
                      )
                    }
                    className="px-3 py-2.5 rounded-xl bg-[var(--fill3)] text-xs font-bold outline-none"
                  >
                    <option value="loan">Home Loan</option>
                    <option value="cash">Cash</option>
                    <option value="installment">Installments</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <input
                  value={obstacle}
                  onChange={(e) => setObstacle(e.target.value)}
                  placeholder="Obstacle / what's stopping the client?"
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--fill3)] text-xs font-semibold outline-none"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--label3)]">Next Follow-up</span>
                  <input
                    type="date"
                    value={nextFollowDate}
                    onChange={(e) => setNextFollowDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--fill3)] font-semibold outline-none"
                  />
                </div>
              </div>
            )}

            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Visit / Deal summary notes..."
              className="w-full p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--sep2)] text-xs outline-none"
            />

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#27C6A0] text-[#101C35] font-extrabold text-sm cursor-pointer"
            >
              Save Deal
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
