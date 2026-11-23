import React, { useEffect, useState } from 'react';
import { ChevronLeft, Check, Home, Plus, Download } from 'lucide-react';
import type { BrokerProfile, PropertyPurpose, PropertyType, Requirement } from '../types/crm';
import { DONB_INTENTS, DONB_SUGGESTED_BROKERS } from '../data/seedData';
import { buildWhatsAppPreviewMessage, numToWord } from '../utils/crmHelpers';

interface OnboardingFlowProps {
  initialSlide?: number;
  profile: BrokerProfile;
  connectedPartnerIds: string[];
  onUpdateProfile: (patch: Partial<BrokerProfile>) => void;
  onToggleConnectBroker: (uid: string) => void;
  onSaveRequirement: (req: Omit<Requirement, 'id' | 'createdAt'>) => void;
  onFinish: (action: 'skip' | 'prop' | 'lead' | 'tour') => void;
}

const SLIDE_LABELS = [
  '1. Welcome',
  '2. Pain Points',
  '3. Profile',
  '4. Greeting',
  '5. City',
  '6. Requirement',
  '7. Network',
  '8. Ready',
];

const TYPE_NAME_PAIRS: [string, string][] = [
  ['Rajdeep', 'Singh'],
  ['Aman', 'Verma'],
  ['Priya', 'Sharma'],
];
const TYPE_PHONES = ['9876543210', '8123456789', '9988776655'];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialSlide = 1,
  profile,
  connectedPartnerIds,
  onUpdateProfile,
  onToggleConnectBroker,
  onSaveRequirement,
  onFinish,
}) => {
  const [slide, setSlide] = useState<number>(initialSlide);
  const [selectedIntents, setSelectedIntents] = useState<string[]>(['followups', 'matching']);
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [greetingSel, setGreetingSel] = useState(profile.greeting || '__time__');
  const [customGreeting, setCustomGreeting] = useState('');
  const [city, setCity] = useState(profile.city || '');

  // Animated typing placeholders for Slide 3
  const [phFirst, setPhFirst] = useState('Rajdeep');
  const [phLast, setPhLast] = useState('Singh');
  const [phPhone, setPhPhone] = useState('9876543210');

  // Slide 6 requirement state
  const [showReqForm, setShowReqForm] = useState(false);
  const [reqType, setReqType] = useState<PropertyType>('flat');
  const [reqCategory, setReqCategory] = useState<PropertyPurpose>('sale');
  const [reqBudget, setReqBudget] = useState('5000000');
  const [reqLocation, setReqLocation] = useState('Vijay Nagar');
  const [reqClientName, setReqClientName] = useState('');
  const [reqClientPhone, setReqClientPhone] = useState('');
  const [installToast, setInstallToast] = useState<string | null>(null);

  useEffect(() => {
    setSlide(initialSlide);
  }, [initialSlide]);

  useEffect(() => {
    if (slide !== 3) return;
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % TYPE_NAME_PAIRS.length;
      setPhFirst(TYPE_NAME_PAIRS[idx][0]);
      setPhLast(TYPE_NAME_PAIRS[idx][1]);
      setPhPhone(TYPE_PHONES[idx % TYPE_PHONES.length]);
    }, 2400);
    return () => clearInterval(timer);
  }, [slide]);

  const effectiveGreeting =
    greetingSel === '__custom__' ? customGreeting || 'Hello' : greetingSel;
  const fullName = `${firstName} ${lastName}`.trim() || profile.name || 'Aarav Patel';

  const waPreviewText = buildWhatsAppPreviewMessage({
    greeting: effectiveGreeting,
    brokerName: fullName,
    phone: phone || '9826012345',
  });

  const toggleIntent = (id: string) => {
    setSelectedIntents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveProfileStep = (nextSlide: number) => {
    onUpdateProfile({
      firstName: firstName.trim() || profile.firstName,
      lastName: lastName.trim() || profile.lastName,
      name: fullName,
      phone: phone.trim() || profile.phone,
      greeting: effectiveGreeting,
      city: city.trim() || profile.city,
    });
    setSlide(nextSlide);
  };

  const handleSaveReq = () => {
    onSaveRequirement({
      clientName: reqClientName.trim() || 'New Buyer Lead',
      clientPhone: reqClientPhone.trim(),
      category: reqCategory,
      propType: reqType,
      location: reqLocation.trim() || city || 'Indore',
      budget: parseFloat(reqBudget) || 5000000,
      shareOnNetwork: true,
    });
    setSlide(7);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--card)] text-[var(--label)] flex flex-col overflow-hidden">
      {/* Ambient Navy & Teal Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="animate-blue-glow absolute -top-60 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(16,28,53,0.18) 0%, rgba(16,28,53,0) 70%)',
          }}
        />
        <div
          className="animate-purple-glow absolute -bottom-64 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(39,198,160,0.22) 0%, rgba(39,198,160,0) 70%)',
          }}
        />
      </div>

      {/* Top Slide Bar for direct slide inspection */}
      <div className="relative z-20 flex items-center justify-between gap-3 px-4 pt-3 pb-2 border-b border-[var(--sep2)] bg-white/75 dark:bg-slate-900/75 backdrop-blur-md">
        <div className="flex items-center gap-2 shrink-0">
          {slide > 1 ? (
            <button
              type="button"
              onClick={() => setSlide((s) => Math.max(1, s - 1))}
              aria-label="Previous slide"
              className="w-9 h-9 rounded-full bg-[var(--fill2)] flex items-center justify-center text-[var(--label)] hover:bg-[var(--fill1)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {SLIDE_LABELS.map((label, idx) => {
            const num = idx + 1;
            const active = slide === num;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSlide(num)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#101C35] text-white shadow-sm'
                    : 'text-[var(--label3)] hover:text-[var(--label)] hover:bg-[var(--fill3)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onFinish('skip')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--label3)] hover:text-[var(--label)] hover:bg-[var(--fill3)] whitespace-nowrap shrink-0 cursor-pointer"
        >
          Enter CRM
        </button>
      </div>

      {/* Slide Viewport */}
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col items-center">
        {/* SLIDE 1: Welcome to Digital CRM */}
        {slide === 1 && (
          <div className="w-full max-w-md flex-1 flex flex-col items-center justify-between px-6 py-12 text-center animate-reveal-up">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-xs font-extrabold uppercase tracking-[3.5px] text-[var(--label3)] mb-3">
                Welcome to
              </div>
              <h1
                className="font-display text-5xl sm:text-6xl font-black tracking-[-2.5px] leading-none pb-2"
                style={{
                  background: 'linear-gradient(135deg, #101C35, #27C6A0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Digital CRM
              </h1>
              <p className="mt-4 text-sm text-[var(--label3)] max-w-xs leading-relaxed">
                Real estate CRM built for Indian brokers — leads, properties, site visits, pipeline & broker network in one place.
              </p>
            </div>

            <div className="w-full space-y-6">
              <div className="inline-block text-xs font-extrabold uppercase tracking-[1.6px] text-[var(--label3)] border-b border-[var(--sep)] pb-2">
                BUILT BY X BROKERS
              </div>
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => onFinish('skip')}
                  className="flex-[0_0_34%] h-14 rounded-full bg-[var(--fill2)] text-[var(--label2)] font-bold text-sm hover:bg-[var(--fill1)] active:scale-95 transition-all cursor-pointer"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => setSlide(2)}
                  className="flex-1 h-14 rounded-full text-white font-extrabold text-sm shadow-lg shadow-[#101C35]/25 active:scale-95 transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(120deg, #101C35, #27C6A0)' }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: Intent / Broker Pain Points */}
        {slide === 2 && (
          <div className="w-full max-w-lg flex-1 flex flex-col justify-between px-6 py-8 animate-reveal-up">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                What brings you to Digital CRM?
              </h2>
              <p className="text-sm text-[var(--label3)] mb-6">
                These are common broker issues. Which do you relate to? (Tap to reveal industry stats)
              </p>

              <div className="space-y-3">
                {DONB_INTENTS.map((item) => {
                  const isSel = selectedIntents.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleIntent(item.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSel
                          ? 'border-[#27C6A0]/55 bg-gradient-to-r from-[#101C35]/8 to-[#27C6A0]/12 shadow-sm'
                          : 'border-[var(--sep2)] bg-[var(--card)] hover:bg-[var(--fill3)]'
                      }`}
                    >
                      {!isSel ? (
                        <div className="text-[15px] font-semibold text-[var(--label)]">
                          {item.label}
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-bold text-[var(--label)]">
                            <span className="font-black text-[#101C35] dark:text-[#27C6A0] tabular-nums">{item.num}</span>{' '}
                            {item.who} face: {item.label.toLowerCase()}
                          </div>
                          <div className="relative h-2.5 rounded-full mt-3 bg-[#101C35]/15">
                            <div
                              className="donb-bar-fill h-full rounded-full"
                              style={
                                {
                                  '--pct': `${item.pct}%`,
                                  background:
                                    'linear-gradient(90deg, #27C6A0 0%, #101C35 100%)',
                                } as React.CSSProperties
                              }
                            />
                            <div
                              className="donb-bar-knob absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-[3px] border-[#27C6A0] shadow-md"
                              style={{ '--pct': `${item.pct}%` } as React.CSSProperties}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-8 space-y-2.5">
              <div className="text-center text-[11px] font-extrabold tracking-widest text-[var(--label3)]">
                STEP 1 OF 6
              </div>
              <button
                type="button"
                disabled={selectedIntents.length === 0}
                onClick={() => setSlide(3)}
                className="w-full h-14 rounded-full text-white font-extrabold text-base shadow-lg shadow-[#101C35]/25 disabled:opacity-40 cursor-pointer"
                style={{ background: 'linear-gradient(120deg, #101C35, #27C6A0)' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 3: Name & Mobile Number + Live WhatsApp Preview */}
        {slide === 3 && (
          <div className="w-full max-w-lg flex-1 flex flex-col justify-between px-6 py-8 animate-reveal-up">
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5">
                  Set up your broker identity
                </h2>
                <p className="text-sm text-[var(--label3)]">
                  Shown on your digital broker card and WhatsApp property messages.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[var(--label3)] mb-1.5">
                    First Name
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={phFirst}
                    className="w-full px-4 py-3.5 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] font-semibold text-sm outline-none focus:border-[#101C35] focus:bg-[var(--card)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[var(--label3)] mb-1.5">
                    Last Name
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={phLast}
                    className="w-full px-4 py-3.5 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] font-semibold text-sm outline-none focus:border-[#101C35] focus:bg-[var(--card)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[var(--label3)] mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder={phPhone}
                  className="w-full px-4 py-3.5 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] font-semibold text-sm tabular-nums outline-none focus:border-[#101C35] focus:bg-[var(--card)]"
                />
              </div>

              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--label3)] mb-2">
                  Live WhatsApp Preview
                </div>
                <div className="bg-[#e5ddd5] rounded-2xl p-4 shadow-inner flex justify-end">
                  <div className="bg-[#dcf8c6] text-[#1f2c34] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap max-w-[85%] shadow-sm">
                    {waPreviewText}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-2">
              <div className="text-center text-[11px] font-extrabold tracking-widest text-[var(--label3)]">
                STEP 2 OF 6
              </div>
              <button
                type="button"
                onClick={() => handleSaveProfileStep(4)}
                className="w-full h-14 rounded-full text-white font-extrabold text-base shadow-lg shadow-[#101C35]/25 cursor-pointer"
                style={{ background: 'linear-gradient(120deg, #101C35, #27C6A0)' }}
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setSlide(4)}
                className="w-full py-2 text-sm font-bold text-[var(--label3)] cursor-pointer"
              >
                I&apos;ll set it up later
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 4: Greeting + Live WhatsApp Preview */}
        {slide === 4 && (
          <div className="w-full max-w-lg flex-1 flex flex-col justify-between px-6 py-8 animate-reveal-up">
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5">
                  How do you greet clients?
                </h2>
                <p className="text-sm text-[var(--label3)]">
                  First line of every WhatsApp property message sent from Digital CRM.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[var(--label3)] mb-1.5">
                  Greeting
                </label>
                <select
                  value={greetingSel}
                  onChange={(e) => setGreetingSel(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] font-semibold text-sm outline-none focus:border-[#101C35]"
                >
                  <option value="__time__">Good morning / evening</option>
                  <option value="Jai Shri Ram 🙏">Jai Shri Ram 🙏</option>
                  <option value="Jai Shri Mahakal 🙏">Jai Shri Mahakal 🙏</option>
                  <option value="Hello">Hello</option>
                  <option value="Hello sir ji 🙏">Hello sir ji 🙏</option>
                  <option value="__custom__">Add yours...</option>
                </select>

                {greetingSel === '__custom__' && (
                  <input
                    value={customGreeting}
                    onChange={(e) => setCustomGreeting(e.target.value)}
                    placeholder="Type your own greeting..."
                    className="w-full mt-3 px-4 py-3.5 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] font-semibold text-sm outline-none focus:border-[#101C35]"
                  />
                )}
              </div>

              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--label3)] mb-2">
                  Live WhatsApp Preview
                </div>
                <div className="bg-[#e5ddd5] rounded-2xl p-4 shadow-inner flex justify-end">
                  <div className="bg-[#dcf8c6] text-[#1f2c34] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap max-w-[85%] shadow-sm">
                    {waPreviewText}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-2">
              <div className="text-center text-[11px] font-extrabold tracking-widest text-[var(--label3)]">
                STEP 3 OF 6
              </div>
              <button
                type="button"
                onClick={() => handleSaveProfileStep(5)}
                className="w-full h-14 rounded-full text-white font-extrabold text-base shadow-lg shadow-[#101C35]/25 cursor-pointer"
                style={{ background: 'linear-gradient(120deg, #101C35, #27C6A0)' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 5: City */}
        {slide === 5 && (
          <div className="w-full max-w-lg flex-1 flex flex-col justify-between px-6 py-8 animate-reveal-up">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5">
                Which city do you work in?
              </h2>
              <p className="text-sm text-[var(--label3)] mb-6">
                This helps us suggest nearby brokers to connect with.
              </p>

              <label className="block text-xs font-extrabold uppercase tracking-wider text-[var(--label3)] mb-1.5">
                City (You work in)
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Indore, Bhopal, Raipur"
                className="w-full px-4 py-4 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] font-semibold text-base outline-none focus:border-[#101C35] focus:bg-[var(--card)]"
              />
            </div>

            <div className="pt-8 space-y-2">
              <div className="text-center text-[11px] font-extrabold tracking-widest text-[var(--label3)]">
                STEP 4 OF 6
              </div>
              <button
                type="button"
                onClick={() => handleSaveProfileStep(6)}
                className="w-full h-14 rounded-full text-white font-extrabold text-base shadow-lg shadow-[#101C35]/25 cursor-pointer"
                style={{ background: 'linear-gradient(120deg, #101C35, #27C6A0)' }}
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setSlide(6)}
                className="w-full py-2 text-sm font-bold text-[var(--label3)] cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 6: First Requirement + Auto-match illustration */}
        {slide === 6 && (
          <div className="w-full max-w-lg flex-1 flex flex-col justify-between px-6 py-8 animate-reveal-up">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5">
                Let&apos;s try to put your property requirement
              </h2>
              <p className="text-sm text-[var(--label3)] mb-6">
                Auto-matches against your inventory &amp; partner broker listings in seconds.
              </p>

              {!showReqForm ? (
                <div className="bg-[var(--fill3)] border border-[var(--sep2)] rounded-2xl p-6 space-y-5 mt-4">
                  {[
                    { title: 'Requirement Added', sub: '3BHK Flat · Vijay Nagar · ₹50–70L' },
                    { title: 'Saved to Pipeline', sub: 'Visible on Today & Network tabs' },
                    { title: 'Auto match in sec.', sub: 'Instant score against all properties' },
                  ].map((step, i) => (
                    <div key={step.title} className="flex items-center gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-[#27C6A0] text-[#101C35] flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold">
                          0{i + 1}. {step.title}
                        </div>
                        <div className="text-xs text-[var(--label3)]">{step.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3.5 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--label3)] mb-1">
                        Property Type
                      </label>
                      <select
                        value={reqType}
                        onChange={(e) => setReqType(e.target.value as PropertyType)}
                        className="w-full px-3.5 py-3 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] text-sm font-semibold"
                      >
                        <option value="flat">Flat</option>
                        <option value="house">House</option>
                        <option value="plot">Plot</option>
                        <option value="farmhouse">Farmhouse</option>
                        <option value="shop">Shop</option>
                        <option value="office">Office</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--label3)] mb-1">
                        Category
                      </label>
                      <select
                        value={reqCategory}
                        onChange={(e) => setReqCategory(e.target.value as PropertyPurpose)}
                        className="w-full px-3.5 py-3 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] text-sm font-semibold"
                      >
                        <option value="sale">Sale</option>
                        <option value="rent">Rent</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--label3)] mb-1">
                        Budget (₹)
                      </label>
                      <input
                        value={reqBudget}
                        onChange={(e) => setReqBudget(e.target.value.replace(/\D/g, ''))}
                        placeholder="5000000"
                        className="w-full px-3.5 py-3 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] text-sm font-semibold tabular-nums"
                      />
                      {reqBudget && (
                        <div className="text-xs font-bold text-[#27C6A0] mt-1">
                          {numToWord(reqBudget)}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--label3)] mb-1">
                        Location
                      </label>
                      <input
                        value={reqLocation}
                        onChange={(e) => setReqLocation(e.target.value)}
                        placeholder="Area / locality"
                        className="w-full px-3.5 py-3 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--label3)] mb-1">
                      Client Name
                    </label>
                    <input
                      value={reqClientName}
                      onChange={(e) => setReqClientName(e.target.value)}
                      placeholder="Client's name"
                      className="w-full px-3.5 py-3 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--label3)] mb-1">
                      Client Number (optional)
                    </label>
                    <input
                      value={reqClientPhone}
                      maxLength={10}
                      onChange={(e) => setReqClientPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile"
                      className="w-full px-3.5 py-3 rounded-xl border border-[var(--sep2)] bg-[var(--fill3)] text-sm font-semibold tabular-nums"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 space-y-2">
              <div className="text-center text-[11px] font-extrabold tracking-widest text-[var(--label3)]">
                STEP 5 OF 6
              </div>
              {!showReqForm ? (
                <button
                  type="button"
                  onClick={() => setShowReqForm(true)}
                  className="w-full h-14 rounded-full text-white font-extrabold text-base shadow-lg shadow-[#101C35]/25 cursor-pointer"
                  style={{ background: 'linear-gradient(120deg, #101C35, #27C6A0)' }}
                >
                  Let&apos;s try
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveReq}
                  className="w-full h-14 rounded-full text-white font-extrabold text-base shadow-lg shadow-[#101C35]/25 cursor-pointer"
                  style={{ background: 'linear-gradient(120deg, #101C35, #27C6A0)' }}
                >
                  Save Requirement
                </button>
              )}
              <button
                type="button"
                onClick={() => setSlide(7)}
                className="w-full py-2 text-sm font-bold text-[var(--label3)] cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 7: Expand your network */}
        {slide === 7 && (
          <div className="w-full max-w-lg flex-1 flex flex-col justify-between px-6 py-8 animate-reveal-up">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5">
                Expand your network
              </h2>
              <p className="text-sm text-[var(--label3)] mb-5">
                Suggested brokers in {city || 'Indore'} — connect now to share inventory &amp; close faster.
              </p>

              <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                {DONB_SUGGESTED_BROKERS.map((b) => {
                  const isConnected = connectedPartnerIds.includes(b.uid);
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--fill3)] border border-[var(--sep2)]"
                    >
                      <div
                        className="w-11 h-11 rounded-full text-white flex items-center justify-center font-extrabold text-base shrink-0"
                        style={{ background: 'linear-gradient(120deg, #101C35, #27C6A0)' }}
                      >
                        {b.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{b.name}</div>
                        <div className="text-xs text-[var(--label3)] truncate">
                          {b.city} · {b.workIn}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleConnectBroker(b.uid)}
                        className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          isConnected
                            ? 'bg-[#27C6A0]/20 text-[#101C35] dark:text-[#27C6A0]'
                            : 'bg-[#101C35] text-white'
                        }`}
                      >
                        {isConnected ? 'Connected ✓' : 'Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 space-y-2.5">
              <div className="text-center text-[11px] font-extrabold tracking-widest text-[var(--label3)]">
                STEP 6 OF 6
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateProfile({ isSignedIn: true });
                  setSlide(8);
                }}
                className="w-full py-3.5 rounded-2xl border border-[var(--sep2)] bg-[var(--card)] flex items-center justify-center gap-2.5 font-bold text-sm shadow-sm cursor-pointer hover:bg-[var(--fill3)]"
              >
                <span className="w-5 h-5 rounded-full bg-[#101C35] text-white text-xs font-black flex items-center justify-center">
                  G
                </span>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => setSlide(8)}
                className="w-full py-2 text-sm font-bold text-[var(--label3)] cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 8: Success */}
        {slide === 8 && (
          <div className="w-full max-w-md flex-1 flex flex-col items-center justify-between px-6 py-12 text-center animate-reveal-up">
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div className="relative animate-donb-pop animate-donb-ring w-20 h-20 rounded-full bg-gradient-to-br from-[#27C6A0] to-[#101C35] text-white flex items-center justify-center shadow-xl shadow-[#27C6A0]/30 mb-6">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight mb-2">
                You&apos;re all set, {fullName.split(' ')[0]}!
              </h2>
              <p className="text-sm text-[var(--label3)] mb-8">
                Time to put Digital CRM to work.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full mb-3">
                <button
                  type="button"
                  onClick={() => onFinish('prop')}
                  className="p-4 rounded-2xl border border-[var(--sep2)] bg-[var(--fill3)] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[var(--fill2)] cursor-pointer"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#101C35]/10 text-[#101C35] dark:bg-[#27C6A0]/15 dark:text-[#27C6A0] flex items-center justify-center">
                    <Home className="w-4 h-4" />
                  </span>
                  Add Property
                </button>
                <button
                  type="button"
                  onClick={() => onFinish('lead')}
                  className="p-4 rounded-2xl border border-[var(--sep2)] bg-[var(--fill3)] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[var(--fill2)] cursor-pointer"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#27C6A0]/18 text-[#101C35] dark:text-[#27C6A0] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </span>
                  Add Leads
                </button>
              </div>

              <button
                type="button"
                onClick={() => onFinish('tour')}
                className="text-sm font-bold text-[#101C35] dark:text-[#27C6A0] py-2 cursor-pointer"
              >
                Take Interactive Spotlight Tour →
              </button>
              <button
                type="button"
                onClick={() => onFinish('skip')}
                className="text-sm font-semibold text-[var(--label3)] py-1.5 cursor-pointer"
              >
                Enter Dashboard Now
              </button>

              {installToast && (
                <div className="mt-4 p-3 rounded-xl bg-[var(--fill3)] text-xs text-[var(--label2)] text-left">
                  {installToast}
                </div>
              )}
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() =>
                  setInstallToast(
                    'To install Digital CRM on your home screen: tap your browser Share / Menu button and choose "Add to Home Screen".'
                  )
                }
                className="w-full h-14 rounded-full text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#101C35]/25 cursor-pointer"
                style={{ background: 'linear-gradient(120deg, #101C35, #27C6A0)' }}
              >
                <Download className="w-5 h-5" />
                Install Digital CRM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
