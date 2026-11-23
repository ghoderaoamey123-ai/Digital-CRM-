import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  ExternalLink,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { Property, PropertyPurpose, PropertyType, PropertyVariant } from '../types/crm';
import {
  formatINR,
  numToWord,
  PROP_TYPE_META,
  smartFilterProperties,
  smartParsePropertyText,
} from '../utils/crmHelpers';

interface PropertiesPageProps {
  properties: Property[];
  onClose: () => void;
  onSaveProperty: (prop: Omit<Property, 'id' | 'createdAt'>, existingId?: string) => void;
  onDeleteProperty: (id: string) => void;
  onToggleSoldOut: (id: string) => void;
  onSharePropertyWA: (prop: Property, variantLabel?: string) => void;
  onBatchShareWA: (props: Property[]) => void;
  openAddImmediately?: boolean;
}

const ALL_TYPES: { key: PropertyType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'flat', label: 'Flat' },
  { key: 'house', label: 'House' },
  { key: 'plot', label: 'Plot' },
  { key: 'farmhouse', label: 'Farm House' },
  { key: 'farmland', label: 'Farm Land' },
  { key: 'shop', label: 'Shop' },
  { key: 'office', label: 'Office' },
  { key: 'room', label: 'Room' },
];

export const PropertiesPage: React.FC<PropertiesPageProps> = ({
  properties,
  onClose,
  onSaveProperty,
  onDeleteProperty,
  onToggleSoldOut,
  onSharePropertyWA,
  onBatchShareWA,
  openAddImmediately = false,
}) => {
  const [smartQuery, setSmartQuery] = useState('');
  const [purpose, setPurpose] = useState<'all' | PropertyPurpose>('all');
  const [propType, setPropType] = useState<'all' | PropertyType>('all');
  const [locQuery, setLocQuery] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [detailProp, setDetailProp] = useState<Property | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(openAddImmediately);
  const [editingProp, setEditingProp] = useState<Property | null>(null);

  // Edit/Add Property form state
  const [smartPasteOpen, setSmartPasteOpen] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState('');
  const [smartPasteMsg, setSmartPasteMsg] = useState('');

  const [fName, setFName] = useState('');
  const [fPurpose, setFPurpose] = useState<PropertyPurpose>('sale');
  const [fType, setFType] = useState<PropertyType>('flat');
  const [fLoc, setFLoc] = useState('');
  const [fLandmark, setFLandmark] = useState('');
  const [fBhk, setFBhk] = useState('');
  const [fArea, setFArea] = useState('');
  const [fRate, setFRate] = useState('');
  const [fPrice, setFPrice] = useState('');
  const [fCommPct, setFCommPct] = useState('2');
  const [fFacing, setFFacing] = useState('');
  const [fRoad, setFRoad] = useState('');
  const [fRera, setFRera] = useState('');
  const [fOwnerName, setFOwnerName] = useState('');
  const [fOwnerPhone, setFOwnerPhone] = useState('');
  const [fMaps, setFMaps] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [fVariants, setFVariants] = useState<PropertyVariant[]>([]);
  const [newVarLabel, setNewVarLabel] = useState('');

  const openEditor = (prop?: Property) => {
    if (prop) {
      setEditingProp(prop);
      setFName(prop.name);
      setFPurpose(prop.purpose);
      setFType(prop.propType);
      setFLoc(prop.location);
      setFLandmark(prop.landmark || '');
      setFBhk(prop.bhk || '');
      setFArea(prop.areaSqft ? String(prop.areaSqft) : '');
      setFRate(prop.ratePerSqft ? String(prop.ratePerSqft) : '');
      setFPrice(prop.price ? String(prop.price) : '');
      setFCommPct(prop.commPct !== undefined ? String(prop.commPct) : '2');
      setFFacing(prop.facing || '');
      setFRoad(prop.roadWidth || '');
      setFRera(prop.rera || '');
      setFOwnerName(prop.ownerName || '');
      setFOwnerPhone(prop.ownerPhone || '');
      setFMaps(prop.mapsLink || '');
      setFNotes(prop.notes || '');
      setFVariants(prop.variants || []);
    } else {
      setEditingProp(null);
      setFName('');
      setFPurpose('sale');
      setFType('flat');
      setFLoc('');
      setFLandmark('');
      setFBhk('');
      setFArea('');
      setFRate('');
      setFPrice('');
      setFCommPct('2');
      setFFacing('');
      setFRoad('');
      setFRera('');
      setFOwnerName('');
      setFOwnerPhone('');
      setFMaps('');
      setFNotes('');
      setFVariants([]);
      setSmartPasteOpen(true);
    }
    setSmartPasteMsg('');
    setEditModalOpen(true);
  };

  const handleSmartPaste = () => {
    if (!smartPasteText.trim()) {
      setSmartPasteMsg('Paste a property description first.');
      return;
    }
    const parsed = smartParsePropertyText(smartPasteText);
    const filled: string[] = [];
    if (parsed.purpose) {
      setFPurpose(parsed.purpose);
      filled.push('Purpose');
    }
    if (parsed.propType) {
      setFType(parsed.propType);
      filled.push('Type');
    }
    if (parsed.name) {
      setFName(parsed.name);
      filled.push('Name');
    }
    if (parsed.location) {
      setFLoc(parsed.location);
      filled.push('Location');
    }
    if (parsed.bhk) {
      setFBhk(parsed.bhk);
      filled.push('BHK');
    }
    if (parsed.sqft) {
      setFArea(String(parsed.sqft));
      filled.push('Area');
    }
    if (parsed.ratePerSqft) {
      setFRate(String(parsed.ratePerSqft));
      filled.push('Rate');
    }
    if (parsed.price) {
      setFPrice(String(parsed.price));
      filled.push('Price');
    }
    if (parsed.facing) {
      setFFacing(parsed.facing);
      filled.push('Facing');
    }
    if (parsed.roadWidth) {
      setFRoad(parsed.roadWidth);
      filled.push('Road');
    }
    if (parsed.notes) {
      setFNotes(parsed.notes);
    }
    setSmartPasteMsg(
      filled.length > 0
        ? `Auto-filled: ${filled.join(', ')}`
        : 'Could not detect structured fields — edit below manually.'
    );
    setSmartPasteOpen(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) return;
    const priceNum = parseFloat(fPrice) || 0;
    onSaveProperty(
      {
        name: fName.trim(),
        purpose: fPurpose,
        propType: fType,
        location: fLoc.trim() || 'Indore',
        landmark: fLandmark.trim() || undefined,
        bhk: fBhk.trim() || undefined,
        areaSqft: parseFloat(fArea) || undefined,
        areaUnit: 'sq.ft',
        ratePerSqft: parseFloat(fRate) || undefined,
        price: priceNum,
        commPct: parseFloat(fCommPct) || 0,
        facing: fFacing.trim() || undefined,
        roadWidth: fRoad.trim() || undefined,
        rera: fRera.trim() || undefined,
        ownerName: fOwnerName.trim() || undefined,
        ownerPhone: fOwnerPhone.trim() || undefined,
        mapsLink: fMaps.trim() || undefined,
        notes: fNotes.trim() || undefined,
        variants: fVariants,
        sharedWith: editingProp?.sharedWith || [],
        isSoldOut: editingProp?.isSoldOut || false,
      },
      editingProp?.id
    );
    setEditModalOpen(false);
  };

  const filteredProps = useMemo(() => {
    let list = smartFilterProperties(properties, smartQuery);
    if (purpose !== 'all') list = list.filter((p) => p.purpose === purpose);
    if (propType !== 'all') list = list.filter((p) => p.propType === propType);
    if (locQuery.trim()) {
      const lq = locQuery.toLowerCase();
      list = list.filter((p) =>
        `${p.name} ${p.location} ${p.landmark || ''}`.toLowerCase().includes(lq)
      );
    }
    const minN = parseFloat(minBudget);
    const maxN = parseFloat(maxBudget);
    if (!Number.isNaN(minN) && minN > 0) list = list.filter((p) => p.price >= minN);
    if (!Number.isNaN(maxN) && maxN > 0) list = list.filter((p) => p.price <= maxN);
    return list;
  }, [properties, smartQuery, purpose, propType, locQuery, minBudget, maxBudget]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const calculatedComm = useMemo(() => {
    const p = parseFloat(fPrice) || 0;
    const pct = parseFloat(fCommPct) || 0;
    if (!p || !pct) return 0;
    return fPurpose === 'rent' && pct === 100 ? p : Math.round((p * pct) / 100);
  }, [fPrice, fCommPct, fPurpose]);

  return (
    <div className="min-h-screen pb-32 max-w-6xl mx-auto">
      {/* Top Bar */}
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
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight">My Property</h1>
            <div className="text-xs font-semibold text-[var(--label3)] tabular-nums">
              {filteredProps.length} of {properties.length} properties
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMultiSelectMode((m) => !m);
              setSelectedIds([]);
            }}
            className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              multiSelectMode
                ? 'bg-[#27C6A0] text-[#101C35]'
                : 'bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {multiSelectMode ? 'Cancel' : 'Select'}
          </button>
          <button
            type="button"
            onClick={() => openEditor()}
            className="px-4 py-2 rounded-full bg-[#101C35] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-3">
        {/* Smart Natural-Language Filter */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] p-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#27C6A0] shrink-0" />
            <input
              value={smartQuery}
              onChange={(e) => setSmartQuery(e.target.value)}
              placeholder='Smart search: e.g. "3BHK flat under 70L Vijay Nagar"'
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-[var(--label3)]"
            />
            {smartQuery && (
              <button
                type="button"
                onClick={() => setSmartQuery('')}
                className="text-xs font-bold text-[#101C35] dark:text-[#27C6A0] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Grouped Apple-Style Filter Card */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] p-3.5 space-y-3 shadow-xs">
          {/* Segment: All / Sale / Rent */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--fill3)]">
            {(['all', 'sale', 'rent'] as const).map((seg) => (
              <button
                key={seg}
                type="button"
                onClick={() => setPurpose(seg)}
                className={`py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  purpose === seg
                    ? 'bg-[var(--card)] text-[var(--label)] shadow-sm'
                    : 'text-[var(--label3)]'
                }`}
              >
                {seg === 'all' ? 'All' : seg === 'sale' ? 'For Sale' : 'For Rent'}
              </button>
            ))}
          </div>

          {/* Type Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {ALL_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setPropType(t.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  propType === t.key
                    ? 'bg-[#101C35] text-white dark:bg-[#27C6A0] dark:text-[#101C35]'
                    : 'bg-[var(--fill3)] text-[var(--label2)] hover:bg-[var(--fill2)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Location + Budget */}
          <div className="pt-2 border-t border-[var(--sep2)] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--fill3)]">
              <Search className="w-3.5 h-3.5 text-[var(--label3)] shrink-0" />
              <input
                value={locQuery}
                onChange={(e) => setLocQuery(e.target.value)}
                placeholder="Area or name..."
                className="w-full bg-transparent text-xs font-semibold outline-none"
              />
            </div>
            <div className="px-3 py-2 rounded-xl bg-[var(--fill3)] flex items-center justify-between gap-2">
              <input
                type="number"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="Min Budget (₹)"
                className="w-full bg-transparent text-xs font-semibold outline-none tabular-nums"
              />
              {minBudget && (
                <span className="text-[10px] font-bold text-[#27C6A0] shrink-0">
                  {numToWord(minBudget)}
                </span>
              )}
            </div>
            <div className="px-3 py-2 rounded-xl bg-[var(--fill3)] flex items-center justify-between gap-2">
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Max Budget (₹)"
                className="w-full bg-transparent text-xs font-semibold outline-none tabular-nums"
              />
              {maxBudget && (
                <span className="text-[10px] font-bold text-[#27C6A0] shrink-0">
                  {numToWord(maxBudget)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Property Cards Grid */}
        {filteredProps.length === 0 ? (
          <div className="bg-[var(--card)] rounded-3xl border border-[var(--sep2)] p-10 text-center">
            <div className="font-display text-lg font-bold mb-1">No matching properties</div>
            <p className="text-sm text-[var(--label3)] mb-4">
              Try clearing your filters or add a new property using Smart Paste.
            </p>
            <button
              type="button"
              onClick={() => openEditor()}
              className="px-4 py-2.5 rounded-xl bg-[#101C35] text-white text-xs font-bold cursor-pointer"
            >
              + Add Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProps.map((p) => {
              const meta = PROP_TYPE_META[p.propType];
              const isSel = selectedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => (multiSelectMode ? toggleSelect(p.id) : setDetailProp(p))}
                  className={`bg-[var(--card)] rounded-[22px] p-4 border shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSel
                      ? 'border-[#27C6A0] ring-2 ring-[#27C6A0]/30'
                      : 'border-[var(--sep2)] hover:shadow-md'
                  } ${p.isSoldOut ? 'opacity-60' : ''}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--label3)]">
                          {meta.emoji} {meta.label} · {p.purpose === 'sale' ? 'Sale' : 'Rent'}
                          {p.bhk ? ` · ${p.bhk}` : ''}
                          {p.isSoldOut ? ' · SOLD OUT' : ''}
                        </div>
                        <h3 className="font-display text-base font-extrabold tracking-tight mt-0.5 truncate">
                          {p.name}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums">
                          {formatINR(p.price)}
                          {p.purpose === 'rent' ? '/mo' : ''}
                        </div>
                        {p.areaSqft && (
                          <div className="text-[11px] font-semibold text-[var(--label3)] tabular-nums">
                            {p.areaSqft} {p.areaUnit || 'sq.ft'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--label2)] mt-2">
                      <MapPin className="w-3.5 h-3.5 text-[var(--label3)] shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>

                    {p.variants.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[var(--label3)]">
                        {p.variants.map((v) => (
                          <span
                            key={v.id}
                            className="px-2 py-0.5 rounded-md bg-[var(--fill3)] tabular-nums"
                          >
                            {v.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pt-2.5 border-t border-[var(--sep2)] flex items-center justify-between gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => onSharePropertyWA(p)}
                      className="h-8 px-3 rounded-xl bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Share WA
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditor(p)}
                        className="h-8 px-3 rounded-xl bg-[var(--fill3)] text-xs font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProperty(p.id)}
                        aria-label="Delete property"
                        className="w-8 h-8 rounded-xl bg-[var(--fill3)] text-[#ff3b30] flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Multi-select Bottom Bar */}
      {multiSelectMode && selectedIds.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#101C35] text-white rounded-full px-5 py-3 shadow-2xl flex items-center gap-4">
          <span className="text-xs font-bold tabular-nums">
            {selectedIds.length} selected
          </span>
          <button
            type="button"
            onClick={() => {
              const sel = properties.filter((p) => selectedIds.includes(p.id));
              onBatchShareWA(sel);
              setMultiSelectMode(false);
              setSelectedIds([]);
            }}
            className="px-4 py-1.5 rounded-full bg-[#27C6A0] text-[#101C35] text-xs font-extrabold cursor-pointer"
          >
            Share All on WhatsApp
          </button>
        </div>
      )}

      {/* Property Detail Modal */}
      {detailProp && (
        <div
          onClick={() => setDetailProp(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[var(--card)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4 animate-sheet-up"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#27C6A0]">
                  {PROP_TYPE_META[detailProp.propType].emoji}{' '}
                  {PROP_TYPE_META[detailProp.propType].label} ·{' '}
                  {detailProp.purpose === 'sale' ? 'For Sale' : 'For Rent'}
                </div>
                <h3 className="font-display text-2xl font-extrabold mt-0.5">{detailProp.name}</h3>
                <div className="text-xs font-semibold text-[var(--label3)] mt-0.5">
                  {detailProp.location}
                  {detailProp.landmark ? ` · Near ${detailProp.landmark}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailProp(null)}
                className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-[var(--fill3)]">
                <div className="text-[10px] font-bold uppercase text-[var(--label3)]">Price</div>
                <div className="text-base font-extrabold text-[#101C35] dark:text-[#27C6A0] tabular-nums mt-0.5">
                  {formatINR(detailProp.price)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--fill3)]">
                <div className="text-[10px] font-bold uppercase text-[var(--label3)]">Area</div>
                <div className="text-base font-extrabold tabular-nums mt-0.5">
                  {detailProp.areaSqft ? `${detailProp.areaSqft} sqft` : '—'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--fill3)]">
                <div className="text-[10px] font-bold uppercase text-[var(--label3)]">
                  Commission
                </div>
                <div className="text-base font-extrabold text-[#27C6A0] tabular-nums mt-0.5">
                  {detailProp.commPct || 2}%
                </div>
              </div>
            </div>

            <div className="bg-[var(--fill3)] rounded-2xl p-4 space-y-2 text-xs">
              {detailProp.facing && (
                <div className="flex justify-between">
                  <span className="text-[var(--label3)]">Facing</span>
                  <span className="font-bold">{detailProp.facing}</span>
                </div>
              )}
              {detailProp.roadWidth && (
                <div className="flex justify-between">
                  <span className="text-[var(--label3)]">Road Width</span>
                  <span className="font-bold">{detailProp.roadWidth}</span>
                </div>
              )}
              {detailProp.rera && (
                <div className="flex justify-between">
                  <span className="text-[var(--label3)]">Approval / RERA</span>
                  <span className="font-bold">{detailProp.rera}</span>
                </div>
              )}
              {detailProp.ownerName && (
                <div className="flex justify-between">
                  <span className="text-[var(--label3)]">Owner</span>
                  <span className="font-bold">
                    {detailProp.ownerName} {detailProp.ownerPhone ? `· ${detailProp.ownerPhone}` : ''}
                  </span>
                </div>
              )}
              {detailProp.notes && (
                <div className="pt-2 border-t border-[var(--sep2)] text-[var(--label2)] leading-relaxed">
                  {detailProp.notes}
                </div>
              )}
            </div>

            {detailProp.variants.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--label3)] mb-2">
                  Available Units / Variants
                </div>
                <div className="space-y-1.5">
                  {detailProp.variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--fill3)] text-xs font-bold"
                    >
                      <span>{v.label}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onSharePropertyWA(detailProp, v.label);
                          setDetailProp(null);
                        }}
                        className="text-[#27C6A0] font-extrabold cursor-pointer"
                      >
                        Share Unit →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  onSharePropertyWA(detailProp);
                  setDetailProp(null);
                }}
                className="py-3 rounded-xl bg-[#27C6A0] text-[#101C35] text-xs font-extrabold cursor-pointer"
              >
                Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleSoldOut(detailProp.id);
                  setDetailProp(null);
                }}
                className="py-3 rounded-xl bg-[var(--fill2)] text-[var(--label)] text-xs font-bold cursor-pointer"
              >
                {detailProp.isSoldOut ? 'Mark Available' : 'Mark Sold Out'}
              </button>
            </div>
            {detailProp.mapsLink && (
              <a
                href={detailProp.mapsLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl border border-[var(--sep2)] text-xs font-bold text-[#101C35] dark:text-[#27C6A0] flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Google Maps Location
              </a>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Property Sheet with Smart Paste */}
      {editModalOpen && (
        <div
          onClick={() => setEditModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveForm}
            className="w-full max-w-xl bg-[var(--bg)] rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto animate-sheet-up"
          >
            {/* Sticky Navbar with Smart Paste Trigger */}
            <div className="sticky top-0 z-20 bg-[var(--bg)]/95 backdrop-blur-md px-5 py-3.5 border-b border-[var(--sep2)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--fill2)] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-display text-lg font-extrabold">
                  {editingProp ? 'Edit Property' : 'New Property'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSmartPasteOpen((o) => !o)}
                className="px-3.5 py-1.5 rounded-full bg-[#101C35] text-white dark:bg-[#27C6A0] dark:text-[#101C35] text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Smart Paste
              </button>
            </div>

            {/* Expandable Smart Paste Box */}
            {smartPasteOpen && (
              <div className="bg-[var(--card)] p-4 border-b border-[var(--sep2)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">
                    Smart Paste — auto fill from WhatsApp message
                  </span>
                  <button
                    type="button"
                    onClick={() => setSmartPasteOpen(false)}
                    className="text-xs font-bold text-[var(--label3)] cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={smartPasteText}
                  onChange={(e) => setSmartPasteText(e.target.value)}
                  placeholder="e.g. 3BHK flat for sale in Vijay Nagar Indore, 1450 sqft, East facing, 40 ft road, 62L"
                  className="w-full p-3 rounded-xl bg-[var(--fill3)] border border-[var(--sep2)] text-xs outline-none resize-y"
                />
                <button
                  type="button"
                  onClick={handleSmartPaste}
                  className="w-full py-2.5 rounded-xl bg-[#101C35] text-white text-xs font-extrabold cursor-pointer"
                >
                  Auto Fill Fields
                </button>
              </div>
            )}

            {smartPasteMsg && (
              <div className="mx-5 mt-3 px-3.5 py-2 rounded-xl bg-[#27C6A0]/15 text-[#101C35] dark:text-[#27C6A0] text-xs font-bold">
                {smartPasteMsg}
              </div>
            )}

            <div className="p-5 space-y-4">
              {/* Purpose */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--card)] border border-[var(--sep2)]">
                {(['sale', 'rent'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFPurpose(p)}
                    className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                      fPurpose === p ? 'bg-[#101C35] text-white' : 'text-[var(--label3)]'
                    }`}
                  >
                    {p === 'sale' ? 'For Sale' : 'For Rent'}
                  </button>
                ))}
              </div>

              {/* Property Type */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--label3)] mb-2">
                  Property Type
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(PROP_TYPE_META) as PropertyType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFType(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        fType === t
                          ? 'bg-[#101C35] text-white dark:bg-[#27C6A0] dark:text-[#101C35]'
                          : 'bg-[var(--card)] border border-[var(--sep2)] text-[var(--label2)]'
                      }`}
                    >
                      {PROP_TYPE_META[t].emoji} {PROP_TYPE_META[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Inputs */}
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] divide-y divide-[var(--sep2)]">
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)] shrink-0">Title *</label>
                  <input
                    required
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="e.g. Skyline 3BHK"
                    className="w-full text-right text-sm font-semibold bg-transparent outline-none"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)] shrink-0">Location *</label>
                  <input
                    required
                    value={fLoc}
                    onChange={(e) => setFLoc(e.target.value)}
                    placeholder="Area, City"
                    className="w-full text-right text-sm font-semibold bg-transparent outline-none"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)] shrink-0">Landmark</label>
                  <input
                    value={fLandmark}
                    onChange={(e) => setFLandmark(e.target.value)}
                    placeholder="Near mall, school..."
                    className="w-full text-right text-sm font-semibold bg-transparent outline-none"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)] shrink-0">Price (₹)</label>
                  <input
                    type="number"
                    value={fPrice}
                    onChange={(e) => setFPrice(e.target.value)}
                    placeholder="e.g. 5500000"
                    className="w-full text-right text-sm font-bold text-[#101C35] dark:text-[#27C6A0] bg-transparent outline-none tabular-nums"
                  />
                </div>
                {fPrice && (
                  <div className="px-4 py-1.5 text-right text-xs font-bold text-[#27C6A0]">
                    {numToWord(fPrice)}
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)] shrink-0">
                    Area (sq.ft)
                  </label>
                  <input
                    type="number"
                    value={fArea}
                    onChange={(e) => setFArea(e.target.value)}
                    placeholder="e.g. 1450"
                    className="w-full text-right text-sm font-semibold bg-transparent outline-none tabular-nums"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)] shrink-0">
                    Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={fCommPct}
                    onChange={(e) => setFCommPct(e.target.value)}
                    className="w-full text-right text-sm font-semibold bg-transparent outline-none tabular-nums"
                  />
                </div>
                {calculatedComm > 0 && (
                  <div className="px-4 py-2 text-right text-xs font-bold text-[#27C6A0] tabular-nums">
                    Estimated Brokerage: {formatINR(calculatedComm)}
                  </div>
                )}
              </div>

              {/* Extra Specs */}
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] divide-y divide-[var(--sep2)]">
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)]">BHK / Config</label>
                  <input
                    value={fBhk}
                    onChange={(e) => setFBhk(e.target.value)}
                    placeholder="e.g. 3BHK"
                    className="text-right text-sm font-semibold bg-transparent outline-none"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)]">Facing</label>
                  <input
                    value={fFacing}
                    onChange={(e) => setFFacing(e.target.value)}
                    placeholder="East / North-East"
                    className="text-right text-sm font-semibold bg-transparent outline-none"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)]">Road Width</label>
                  <input
                    value={fRoad}
                    onChange={(e) => setFRoad(e.target.value)}
                    placeholder="40 ft"
                    className="text-right text-sm font-semibold bg-transparent outline-none"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)]">Owner Name</label>
                  <input
                    value={fOwnerName}
                    onChange={(e) => setFOwnerName(e.target.value)}
                    placeholder="Optional"
                    className="text-right text-sm font-semibold bg-transparent outline-none"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <label className="text-xs font-bold text-[var(--label3)]">Google Maps URL</label>
                  <input
                    value={fMaps}
                    onChange={(e) => setFMaps(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="text-right text-sm font-semibold bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Variants */}
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--sep2)] p-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--label3)]">
                  Units / Variants
                </div>
                <div className="flex gap-2">
                  <input
                    value={newVarLabel}
                    onChange={(e) => setNewVarLabel(e.target.value)}
                    placeholder="e.g. 2BHK · 1100 sqft"
                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--fill3)] text-xs font-semibold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newVarLabel.trim()) return;
                      setFVariants((prev) => [
                        ...prev,
                        { id: `var_${Date.now()}`, label: newVarLabel.trim() },
                      ]);
                      setNewVarLabel('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#101C35] text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {fVariants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {fVariants.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--fill3)] text-xs font-semibold"
                      >
                        {v.label}
                        <button
                          type="button"
                          onClick={() =>
                            setFVariants((prev) => prev.filter((x) => x.id !== v.id))
                          }
                          className="text-[#ff3b30] font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                rows={3}
                value={fNotes}
                onChange={(e) => setFNotes(e.target.value)}
                placeholder="Notes, amenities, builder details..."
                className="w-full p-4 rounded-2xl bg-[var(--card)] border border-[var(--sep2)] text-sm outline-none"
              />

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#101C35] text-white font-extrabold text-sm shadow-lg shadow-[#101C35]/25 cursor-pointer"
              >
                {editingProp ? 'Update Property' : 'Save Property'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
