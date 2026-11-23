import type { Lead, Property, PropertyPurpose, PropertyType, Requirement } from '../types/crm';

export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shiftDateStr(dateStr: string, deltaDays: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  const td = todayStr();
  if (dateStr === td) return 'Today';
  if (dateStr === shiftDateStr(td, -1)) return 'Yesterday';
  if (dateStr === shiftDateStr(td, 1)) return 'Tomorrow';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function dueSinceLabel(dateStr?: string): string {
  if (!dateStr) return '';
  const td = todayStr();
  if (dateStr >= td) return '';
  const diff = Math.floor(
    (new Date(td + 'T00:00:00').getTime() - new Date(dateStr + 'T00:00:00').getTime()) / 86400000
  );
  if (diff <= 0) return '';
  if (diff === 1) return 'Due since yesterday';
  return `Due since ${diff} days`;
}

export function formatINR(amount: number): string {
  if (!amount || Number.isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  }
  if (amount >= 1000) {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }
  return `₹${Math.round(amount)}`;
}

export function numToWord(val: number | string): string {
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^\d.]/g, '')) : val;
  if (!n || Number.isNaN(n)) return '';
  if (n >= 10000000) {
    const cr = n / 10000000;
    return `${cr.toFixed(2).replace(/\.00$/, '')} Crore`;
  }
  if (n >= 100000) {
    const lac = n / 100000;
    return `${lac.toFixed(2).replace(/\.00$/, '')} Lakh${lac >= 2 ? 's' : ''}`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toFixed(1).replace(/\.0$/, '')} Thousand`;
  }
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function parseBudgetTextToNum(text: string): number {
  const s = (text || '').toLowerCase().replace(/,/g, '').trim();
  if (!s) return 0;
  const cr = s.match(/([\d.]+)\s*(?:cr|crore)/);
  if (cr) return Math.round(parseFloat(cr[1]) * 10000000);
  const lac = s.match(/([\d.]+)\s*(?:l|lac|lakh|lakhs)/);
  if (lac) return Math.round(parseFloat(lac[1]) * 100000);
  const k = s.match(/([\d.]+)\s*(?:k|thousand)/);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const raw = parseFloat(s.replace(/[^\d.]/g, ''));
  return Number.isNaN(raw) ? 0 : Math.round(raw);
}

export function getLeadActiveDate(l: Lead): string {
  if (l.type === 'visit') return l.visitDate || l.leadDate;
  if (l.type === 'follow') return l.nextFollowup || l.leadDate;
  if (l.type === 'reschedule') return l.reschedDate || l.nextFollowup || l.leadDate;
  return l.leadDate;
}

export const PROP_TYPE_META: Record<PropertyType, { label: string; emoji: string }> = {
  flat: { label: 'Flat', emoji: '🏠' },
  house: { label: 'House', emoji: '🏡' },
  plot: { label: 'Plot', emoji: '📐' },
  farmhouse: { label: 'Farm House', emoji: '🌿' },
  farmland: { label: 'Farm Land', emoji: '🌾' },
  shop: { label: 'Shop', emoji: '🏪' },
  office: { label: 'Office', emoji: '🏢' },
  room: { label: 'Room', emoji: '🛏' },
};

export function getGreetingByTime(): string {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

export function resolveGreetingText(greeting: string): string {
  if (!greeting || greeting === '__time__') return getGreetingByTime();
  return greeting;
}

export function buildWhatsAppPreviewMessage(params: {
  greeting: string;
  brokerName: string;
  phone: string;
  clientNickname?: string;
  property?: Property;
  variantLabel?: string;
  includeMap?: boolean;
}): string {
  const opener = resolveGreetingText(params.greeting);
  const nick = params.clientNickname ? ` ${params.clientNickname}` : '';
  if (!params.property) {
    return `${opener}${nick},\nSharing the best property options from ${params.brokerName || 'Digital CRM'}.\n\nCall/WhatsApp: ${params.phone || '9876543210'}`;
  }
  const p = params.property;
  const meta = PROP_TYPE_META[p.propType];
  const lines = [
    `${opener}${nick},`,
    ``,
    `${meta.emoji} *${p.name}*${params.variantLabel ? ` (${params.variantLabel})` : ''}`,
    `📍 Location: ${p.location}${p.landmark ? ` (Near ${p.landmark})` : ''}`,
    `🏷️ For ${p.purpose === 'sale' ? 'Sale' : 'Rent'} · ${meta.label}${p.bhk ? ` · ${p.bhk}` : ''}`,
    p.areaSqft ? `📐 Area: ${p.areaSqft} ${p.areaUnit || 'sq.ft'}` : '',
    `💰 Price: ${formatINR(p.price)}${p.purpose === 'rent' ? '/month' : ''}`,
    p.facing ? `🧭 Facing: ${p.facing}` : '',
    p.notes ? `✨ ${p.notes}` : '',
    params.includeMap && p.mapsLink ? `🗺️ Location Pin: ${p.mapsLink}` : '',
    ``,
    `Regards,`,
    `*${params.brokerName || 'Digital CRM Broker'}*`,
    `📞 ${params.phone || ''}`,
  ].filter(Boolean);
  return lines.join('\n');
}

export interface SmartParseResult {
  purpose?: PropertyPurpose;
  propType?: PropertyType;
  bhk?: string;
  name?: string;
  location?: string;
  sqft?: number;
  price?: number;
  ratePerSqft?: number;
  facing?: string;
  roadWidth?: string;
  rera?: string;
  notes?: string;
}

export function smartParsePropertyText(raw: string): SmartParseResult {
  const text = (raw || '').trim();
  const lower = text.toLowerCase();
  const res: SmartParseResult = {};

  if (/\b(rent|lease|kiraya|per month|\/mo)\b/.test(lower)) res.purpose = 'rent';
  else if (/\b(sale|sell|resale|buy|bikaau)\b/.test(lower)) res.purpose = 'sale';

  if (/\bfarm\s*house\b/.test(lower)) res.propType = 'farmhouse';
  else if (/\bfarm\s*land|agri\b/.test(lower)) res.propType = 'farmland';
  else if (/\bplot|land\b/.test(lower)) res.propType = 'plot';
  else if (/\bflat|apartment|bhk|penthouse\b/.test(lower)) res.propType = 'flat';
  else if (/\bhouse|villa|duplex|bungalow|kothi\b/.test(lower)) res.propType = 'house';
  else if (/\bshop|showroom|retail\b/.test(lower)) res.propType = 'shop';
  else if (/\boffice|commercial\b/.test(lower)) res.propType = 'office';
  else if (/\broom|pg|hostel\b/.test(lower)) res.propType = 'room';

  const bhkMatch = text.match(/(\d\s*BHK)/i);
  if (bhkMatch) res.bhk = bhkMatch[1].toUpperCase().replace(/\s+/g, '');

  const areaMatch = text.match(/(\d{3,6})\s*(?:sq\.?\s*ft|sqft|sft)/i);
  if (areaMatch) res.sqft = parseInt(areaMatch[1], 10);

  const rateMatch = text.match(/(?:rs\.?|₹|@)?\s*(\d{3,5})\s*(?:\/|\s*per\s*)\s*(?:sq\.?\s*ft|sqft)/i);
  if (rateMatch) res.ratePerSqft = parseInt(rateMatch[1], 10);

  const crMatch = text.match(/(?:rs\.?|₹)?\s*([\d.]+)\s*(?:cr|crore)\b/i);
  const lacMatch = text.match(/(?:rs\.?|₹)?\s*([\d.]+)\s*(?:l|lac|lakh|lakhs)\b/i);
  const kMatch = text.match(/(?:rs\.?|₹)?\s*([\d.]+)\s*k\b/i);
  if (crMatch) res.price = Math.round(parseFloat(crMatch[1]) * 10000000);
  else if (lacMatch) res.price = Math.round(parseFloat(lacMatch[1]) * 100000);
  else if (kMatch) res.price = Math.round(parseFloat(kMatch[1]) * 1000);

  const facingMatch = text.match(/\b(north-east|north-west|south-east|south-west|east|west|north|south)\s*(?:facing)?\b/i);
  if (facingMatch) res.facing = facingMatch[1].replace(/\b\w/g, (c) => c.toUpperCase());

  const roadMatch = text.match(/(\d{2,3})\s*(?:ft|feet)\s*road/i);
  if (roadMatch) res.roadWidth = `${roadMatch[1]} ft`;

  const locKeywords = ['Vijay Nagar', 'Super Corridor', 'Arera Colony', 'Rau', 'Silicon City', 'Ujjain Road', 'AB Road', 'MR10', 'Bypass', 'Kolar Road', 'Bhopal', 'Indore', 'Raipur'];
  for (const loc of locKeywords) {
    if (lower.includes(loc.toLowerCase())) {
      res.location = loc;
      break;
    }
  }
  if (!res.location) {
    const parts = text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) res.location = parts[1].slice(0, 40);
  }

  const firstPart = text.split(/[,\n]/)[0]?.trim();
  if (firstPart) res.name = firstPart.slice(0, 48);
  res.notes = text;

  return res;
}

export function smartFilterProperties(props: Property[], query: string): Property[] {
  const q = (query || '').toLowerCase().trim();
  if (!q) return props;

  // Check for "under 50L" or "below 1 Cr"
  let maxPrice = Infinity;
  const underMatch = q.match(/(?:under|below|max|upto|<)\s*([\d.]+\s*(?:cr|crore|l|lac|lakh|lakhs|k))/i);
  if (underMatch) {
    const parsed = parseBudgetTextToNum(underMatch[1]);
    if (parsed > 0) maxPrice = parsed;
  }

  let purposeFilter: PropertyPurpose | null = null;
  if (/\brent\b/.test(q)) purposeFilter = 'rent';
  else if (/\bsale|buy\b/.test(q)) purposeFilter = 'sale';

  const cleanedTokens = q
    .replace(/(?:under|below|max|upto|<)\s*[\d.]+\s*(?:cr|crore|l|lac|lakh|lakhs|k)/gi, '')
    .replace(/\b(in|at|near|for|with|and|property|properties)\b/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);

  return props.filter((p) => {
    if (p.price > maxPrice) return false;
    if (purposeFilter && p.purpose !== purposeFilter) return false;
    if (!cleanedTokens.length) return true;
    const hay = `${p.name} ${p.location} ${p.landmark || ''} ${p.propType} ${p.bhk || ''} ${p.notes || ''} ${p.variants.map((v) => v.label).join(' ')}`.toLowerCase();
    return cleanedTokens.every((t) => hay.includes(t));
  });
}

export interface MatchResult {
  requirement: Requirement;
  property: Property;
  score: number;
  strength: 'Strong' | 'Good' | 'Possible';
  reasons: string[];
}

export function matchRequirementsToProps(reqs: Requirement[], props: Property[]): MatchResult[] {
  const results: MatchResult[] = [];
  const activeProps = props.filter((p) => !p.isSoldOut);
  for (const r of reqs) {
    for (const p of activeProps) {
      if (r.category && p.purpose !== r.category) continue;
      let score = 40;
      const reasons: string[] = [];

      if (r.propType === p.propType) {
        score += 25;
        reasons.push(`${PROP_TYPE_META[p.propType].label} match`);
      }
      if (r.budget > 0 && p.price > 0) {
        const ratio = p.price / r.budget;
        if (ratio <= 1.0) {
          score += 20;
          reasons.push('Within budget');
        } else if (ratio <= 1.15) {
          score += 10;
          reasons.push('Near budget (+15%)');
        } else {
          continue;
        }
      }
      if (r.location && p.location) {
        const rl = r.location.toLowerCase();
        const pl = `${p.location} ${p.landmark || ''}`.toLowerCase();
        const locWords = rl.split(/[\s,]+/).filter((w) => w.length > 2);
        if (locWords.some((w) => pl.includes(w))) {
          score += 15;
          reasons.push(`Near ${r.location}`);
        }
      }

      if (score >= 60) {
        const strength: MatchResult['strength'] = score >= 90 ? 'Strong' : score >= 75 ? 'Good' : 'Possible';
        results.push({ requirement: r, property: p, score: Math.min(100, score), strength, reasons });
      }
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

export function formatBrokerId(id: string): string {
  return id.toUpperCase();
}
