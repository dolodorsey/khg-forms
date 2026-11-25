'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { renderNda, sha256Hex } from '../lib/ndaRender';

const ENDPOINT = 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/team-onboarding';
const STEPS = ['About you', 'Entities and role', 'Sizes and interests', 'Emergency contact', 'Sign the agreement'];
const LAST = STEPS.length - 1;
const REACH = [
  ['text', 'Text'],
  ['call', 'Phone call'],
  ['email', 'Email'],
  ['any', 'Any of these'],
];
const SIZES = ['', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const SHOES = ['', ...Array.from({ length: 23 }, (_, i) => String(5 + i / 2))];
const INTERESTS = [
  'Events and nightlife', 'Sports and fitness', 'Fashion and clothing', 'Music', 'Food and drink',
  'Technology and apps', 'Social media and content', 'Photography and video', 'Sales and outreach',
  'Community and nonprofit work', 'Business and investing', 'Travel',
];

const blank = {
  full_name: '', preferred_name: '', phone: '', personal_email: '',
  street: '', city: '', state: '', zip: '',
  entity_slug: '', involved_entities: [], role_title: '', duties: '', start_date: '', work_email_local_part: '',
  shirt_size: '', hoodie_size: '', pants_size: '', shoe_size: '', shoe_kind: "Men's", interests: [], interests_notes: '',
  emergency_contact_name: '', emergency_contact_relationship: '', emergency_contact_phone: '',
  preferred_contact_method: 'text', best_time_to_reach: '',
  initials: '', typed_signature: '', electronic_consent: false, website: '',
};

const digits = (v) => String(v || '').replace(/\D/g, '');
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
const squash = (v) => String(v || '').replace(/\s+/g, ' ').trim();

function formatPhone(value) {
  const d = digits(value).slice(0, 11);
  const core = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (core.length < 4) return core;
  if (core.length < 7) return `(${core.slice(0, 3)}) ${core.slice(3)}`;
  return `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6, 10)}`;
}

function suggestLocalPart(form) {
  const base = squash(form.preferred_name || form.full_name.split(' ')[0] || '');
  return base.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.]/g, '').slice(0, 30);
}

function todayLabel(tz) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  }
}

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const strokes = useRef(0);
  const last = useRef(null);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111317';
    strokes.current = 0;
    onChange('');
  }, [onChange]);

  useEffect(() => {
    setup();
    const onResize = () => setup();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setup]);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const down = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = '#111317';
    ctx.fill();
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = point(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    strokes.current += 1;
    onChange(strokes.current > 0 ? canvasRef.current.toDataURL('image/png') : '');
  };

  return (
    <div className="tj-sigwrap">
      <canvas
        ref={canvasRef}
        className="tj-sig"
        aria-label="Draw your signature"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
      <div className="tj-sigline" aria-hidden="true" />
      <button type="button" className="tj-link" onClick={setup}>Clear signature</button>
    </div>
  );
}

function Field({ label, hint, error, children, wide }) {
  return (
    <label className={`tj-field${wide ? ' tj-wide' : ''}${error ? ' tj-has-error' : ''}`}>
      <span className="tj-label">{label}</span>
      {children}
      {error ? <span className="tj-error">{error}</span> : hint ? <span className="tj-hint">{hint}</span> : null}
    </label>
  );
}

export default function TeamOnboardingForm({ initialEntity = '', previewKey = '' }) {
  const [config, setConfig] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ ...blank, entity_slug: initialEntity, involved_entities: initialEntity ? [initialEntity] : [] });
  const [localTouched, setLocalTouched] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [readToEnd, setReadToEnd] = useState(false);
  const [signature, setSignature] = useState('');
  const [status, setStatus] = useState('idle');
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState(null);
  const docRef = useRef(null);
  const topRef = useRef(null);

  const tz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'; } catch { return 'America/New_York'; }
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams({ action: 'config' });
    if (previewKey) qs.set('preview', previewKey);
    fetch(`${ENDPOINT}?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.ok) throw new Error('config');
        setConfig(data);
        if (initialEntity && !data.entities.some((e) => e.slug === initialEntity)) {
          setForm((f) => ({ ...f, entity_slug: '', involved_entities: [] }));
        }
      })
      .catch(() => setLoadError('This page could not load. Check your connection and refresh.'));
  }, [initialEntity, previewKey]);

  const entity = useMemo(() => config?.entities.find((e) => e.slug === form.entity_slug) || null, [config, form.entity_slug]);
  const localPart = localTouched ? form.work_email_local_part : suggestLocalPart(form);
  const address = useMemo(() => [form.street, form.city, form.state, form.zip].map(squash).filter(Boolean).join(', '), [form]);

  const rendered = useMemo(() => {
    if (!config) return '';
    return renderNda(config.nda.body_template, {
      full_name: form.full_name, personal_email: form.personal_email.trim().toLowerCase(), entity_name: entity?.display_name,
      role_title: form.role_title, duties: form.duties, initials: form.initials, consideration: config.nda.default_consideration,
    });
  }, [config, form, entity]);

  const set = (key) => (e) => {
    const value = e?.target?.type === 'checkbox' ? e.target.checked : e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const toggle = (key, value) => {
    setForm((f) => {
      const has = f[key].includes(value);
      const list = has ? f[key].filter((v) => v !== value) : [...f[key], value];
      const next = { ...f, [key]: list };
      if (key === 'involved_entities') {
        if (has && f.entity_slug === value) next.entity_slug = list[0] || '';
        if (!has && !f.entity_slug) next.entity_slug = value;
      }
      return next;
    });
    setErrors((x) => ({ ...x, [key]: undefined, entity_slug: undefined }));
  };

  const validate = (index) => {
    const e = {};
    if (index === 0) {
      const name = squash(form.full_name);
      if (name.length < 3 || !name.includes(' ')) e.full_name = 'Enter your first and last name as they appear on legal documents.';
      if (digits(form.phone).length < 10) e.phone = 'Enter a 10-digit mobile number.';
      if (!emailOk(form.personal_email)) e.personal_email = 'Enter an email you check.';
      if (squash(form.street).length < 4) e.street = 'Enter your street address.';
      if (squash(form.city).length < 2) e.city = 'Enter your city.';
      if (squash(form.state).length < 2) e.state = 'Enter your state.';
      if (digits(form.zip).length < 5) e.zip = 'Enter your ZIP code.';
    }
    if (index === 1) {
      if (form.involved_entities.length === 0) e.involved_entities = 'Check at least one entity.';
      if (!form.entity_slug) e.entity_slug = 'Pick your main entity.';
      if (squash(form.role_title).length < 2) e.role_title = 'Enter your role.';
      if (squash(form.duties).length < 10) e.duties = 'Describe what you will do in a sentence.';
      if (!/^[a-z][a-z0-9.]{0,30}$/.test(localPart)) e.work_email_local_part = 'Use lowercase letters, numbers and dots, starting with a letter.';
    }
    if (index === 2) {
      if (!form.shirt_size) e.shirt_size = 'Choose your shirt size.';
    }
    if (index === 3) {
      if (squash(form.emergency_contact_name).length < 2) e.emergency_contact_name = 'Enter a name.';
      if (digits(form.emergency_contact_phone).length < 10) e.emergency_contact_phone = 'Enter a 10-digit phone number.';
    }
    if (index === 4) {
      if (!readToEnd) e.read = 'Scroll to the end of the agreement first.';
      if (!squash(form.initials)) e.initials = 'Enter your initials.';
      if (squash(form.typed_signature).toLowerCase() !== squash(form.full_name).toLowerCase()) e.typed_signature = `Type your full legal name exactly: ${squash(form.full_name)}`;
      if (!signature) e.signature = 'Draw your signature in the box.';
      if (!form.electronic_consent) e.electronic_consent = 'Check the box to sign electronically.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const go = (next) => {
    if (next > step && !validate(step)) return;
    setStep(next);
    setServerError('');
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const onDocScroll = () => {
    const el = docRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setReadToEnd(true);
  };

  const submit = async () => {
    if (!validate(LAST) || status === 'submitting') return;
    setStatus('submitting');
    setServerError('');
    try {
      const sha = await sha256Hex(rendered);
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          preview_key: previewKey || undefined,
          full_name: squash(form.full_name),
          preferred_name: squash(form.preferred_name),
          phone: formatPhone(form.phone),
          personal_email: form.personal_email.trim().toLowerCase(),
          mailing_address: address,
          entity_slug: form.entity_slug,
          involved_entities: form.involved_entities,
          residence_city: squash(form.city),
          residence_state: squash(form.state),
          hoodie_size: form.hoodie_size,
          pants_size: squash(form.pants_size),
          shoe_size: form.shoe_size ? `${form.shoe_size} ${form.shoe_kind}` : '',
          interests: form.interests,
          interests_notes: squash(form.interests_notes),
          role_title: squash(form.role_title),
          duties: squash(form.duties),
          start_date: form.start_date || '',
          work_email_local_part: localPart,
          shirt_size: form.shirt_size,
          emergency_contact_name: squash(form.emergency_contact_name),
          emergency_contact_relationship: squash(form.emergency_contact_relationship),
          emergency_contact_phone: formatPhone(form.emergency_contact_phone),
          preferred_contact_method: form.preferred_contact_method,
          best_time_to_reach: squash(form.best_time_to_reach),
          initials: squash(form.initials).toUpperCase(),
          typed_signature: squash(form.typed_signature),
          signature_png: signature,
          electronic_consent: !!form.electronic_consent,
          read_to_end: readToEnd,
          timezone: tz,
          nda_rendered_sha256: sha,
          website: form.website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not submit. Try again.');
      setResult(data);
      setStatus('done');
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (err) {
      setServerError(err.message || 'Could not submit. Try again.');
      setStatus('idle');
    }
  };

  const progress = status === 'done' ? 100 : Math.round(((step + 1) / STEPS.length) * 100);
  const closed = config && !config.accepting;

  return (
    <main className="tj-page">
      <header className="tj-band" ref={topRef}>
        <div className="tj-band-inner">
          <p className="tj-kicker">The Kollective Hospitality Group</p>
          <h1 className="tj-title">{status === 'done' ? 'You’re on the team.' : 'Welcome to the team.'}</h1>
          <p className="tj-sub">
            {status === 'done'
              ? 'Your details and signed agreement are saved.'
              : 'About seven minutes. Your details, the entities you want in on, your sizes, then sign and date the team agreement.'}
          </p>
          {previewKey && config?.nda?.status !== 'approved' ? <p className="tj-preview">Preview mode. This link is not open to the team yet.</p> : null}
        </div>
      </header>

      <section className="tj-sheet" aria-live="polite">
        {status !== 'done' ? (
          <div className="tj-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <ol className="tj-steps">
              {STEPS.map((label, i) => (
                <li key={label} className={i === step ? 'is-on' : i < step ? 'is-done' : ''}>
                  <span className="tj-step-num">{i < step ? '✓' : i + 1}</span>
                  <span className="tj-step-label">{label}</span>
                </li>
              ))}
            </ol>
            <div className="tj-bar"><span style={{ width: `${progress}%` }} /></div>
          </div>
        ) : null}

        {loadError ? <p className="tj-alert">{loadError}</p> : null}
        {!config && !loadError ? <p className="tj-loading">Loading…</p> : null}
        {closed ? <p className="tj-alert">This onboarding link isn’t open yet. Check back with Dr. Dorsey’s office.</p> : null}

        {config && !closed && status !== 'done' ? (
          <form onSubmit={(e) => { e.preventDefault(); step < LAST ? go(step + 1) : submit(); }} noValidate>
            <input className="tj-hp" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} aria-hidden="true" />

            {step === 0 ? (
              <div className="tj-grid">
                <h2 className="tj-h2 tj-wide">About you</h2>
                <Field label="Full legal name" hint="As it appears on your ID. You’ll sign with this name." error={errors.full_name} wide>
                  <input value={form.full_name} onChange={set('full_name')} autoComplete="name" />
                </Field>
                <Field label="What should we call you?" hint="Optional nickname.">
                  <input value={form.preferred_name} onChange={set('preferred_name')} autoComplete="nickname" />
                </Field>
                <Field label="Mobile number" error={errors.phone}>
                  <input value={form.phone} onChange={(e) => set('phone')(formatPhone(e.target.value))} inputMode="tel" autoComplete="tel" placeholder="(404) 555-0123" />
                </Field>
                <Field label="Personal email" hint="We’ll send your signed copy here." error={errors.personal_email} wide>
                  <input value={form.personal_email} onChange={set('personal_email')} type="email" inputMode="email" autoComplete="email" />
                </Field>
                <h2 className="tj-h2 tj-wide">Where you live</h2>
                <Field label="Street address" error={errors.street} wide>
                  <input value={form.street} onChange={set('street')} autoComplete="street-address" />
                </Field>
                <Field label="City you live in" error={errors.city}>
                  <input value={form.city} onChange={set('city')} autoComplete="address-level2" />
                </Field>
                <div className="tj-pair">
                  <Field label="State you live in" error={errors.state}>
                    <input value={form.state} onChange={set('state')} autoComplete="address-level1" maxLength={20} />
                  </Field>
                  <Field label="ZIP code" error={errors.zip}>
                    <input value={form.zip} onChange={set('zip')} inputMode="numeric" autoComplete="postal-code" maxLength={10} />
                  </Field>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="tj-grid">
                <h2 className="tj-h2 tj-wide">Which entities do you want to be involved with?</h2>
                <Field label="Check every one you want in on" error={errors.involved_entities} wide>
                  <div className="tj-boxes">
                    {config.entities.map((e) => {
                      const on = form.involved_entities.includes(e.slug);
                      return (
                        <label key={e.slug} className={`tj-box${on ? ' is-on' : ''}`}>
                          <input type="checkbox" checked={on} onChange={() => toggle('involved_entities', e.slug)} />
                          <span>{e.display_name}</span>
                        </label>
                      );
                    })}
                  </div>
                </Field>
                {form.involved_entities.length > 1 ? (
                  <Field label="Your main entity" hint="Your work email and agreement use this one." error={errors.entity_slug} wide>
                    <div className="tj-chips" role="radiogroup">
                      {config.entities.filter((e) => form.involved_entities.includes(e.slug)).map((e) => (
                        <button type="button" key={e.slug} role="radio" aria-checked={form.entity_slug === e.slug}
                          className={`tj-chip${form.entity_slug === e.slug ? ' is-on' : ''}`} onClick={() => set('entity_slug')(e.slug)}>
                          {e.display_name}
                        </button>
                      ))}
                    </div>
                  </Field>
                ) : null}
                <h2 className="tj-h2 tj-wide">Your role</h2>
                <Field label="Your role or title" error={errors.role_title}>
                  <input value={form.role_title} onChange={set('role_title')} placeholder="Outreach lead" />
                </Field>
                <Field label="Start date" hint="Optional.">
                  <input type="date" value={form.start_date} onChange={set('start_date')} />
                </Field>
                <Field label="What you’ll be doing" hint="One or two lines. This goes into your agreement." error={errors.duties} wide>
                  <textarea rows={3} value={form.duties} onChange={set('duties')} maxLength={600} placeholder="Call venues, book meetings and track follow-ups for this entity." />
                </Field>
                <Field label="Work email you’d like" error={errors.work_email_local_part} wide
                  hint={entity?.work_email_domain ? 'We’ll create it after Dr. Dorsey approves.' : 'This entity’s email isn’t set up yet. We’ll save your choice.'}>
                  <div className="tj-email">
                    <input value={localPart} onChange={(e) => { setLocalTouched(true); set('work_email_local_part')(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '')); }}
                      autoCapitalize="none" autoCorrect="off" spellCheck={false} />
                    <span className="tj-domain">@{entity?.work_email_domain || 'entity domain'}</span>
                  </div>
                </Field>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="tj-grid">
                <h2 className="tj-h2 tj-wide">Clothing sizes</h2>
                <p className="tj-note tj-wide">For team shirts, hoodies and gear.</p>
                <Field label="Shirt" error={errors.shirt_size}>
                  <select value={form.shirt_size} onChange={set('shirt_size')}>
                    {SIZES.map((v) => <option key={v} value={v}>{v || 'Choose'}</option>)}
                  </select>
                </Field>
                <Field label="Hoodie or jacket" hint="Optional.">
                  <select value={form.hoodie_size} onChange={set('hoodie_size')}>
                    {SIZES.map((v) => <option key={v} value={v}>{v || 'Choose'}</option>)}
                  </select>
                </Field>
                <Field label="Pants" hint="Waist and length, or a letter size. Optional.">
                  <input value={form.pants_size} onChange={set('pants_size')} maxLength={20} placeholder="32 x 32 or M" />
                </Field>
                <div className="tj-pair">
                  <Field label="Shoe" hint="Optional.">
                    <select value={form.shoe_size} onChange={set('shoe_size')}>
                      {SHOES.map((v) => <option key={v} value={v}>{v || 'Size'}</option>)}
                    </select>
                  </Field>
                  <Field label="Fit">
                    <select value={form.shoe_kind} onChange={set('shoe_kind')}>
                      <option value="Men's">Men's</option>
                      <option value="Women's">Women's</option>
                    </select>
                  </Field>
                </div>
                <h2 className="tj-h2 tj-wide">What are you into?</h2>
                <Field label="Check anything that fits" hint="Optional. Helps us match you to the right work." wide>
                  <div className="tj-boxes">
                    {INTERESTS.map((v) => {
                      const on = form.interests.includes(v);
                      return (
                        <label key={v} className={`tj-box${on ? ' is-on' : ''}`}>
                          <input type="checkbox" checked={on} onChange={() => toggle('interests', v)} />
                          <span>{v}</span>
                        </label>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Anything else you’re into or good at?" hint="Optional." wide>
                  <textarea rows={3} value={form.interests_notes} onChange={set('interests_notes')} maxLength={600} placeholder="Run clubs, DJing, event hosting, graphic design" />
                </Field>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="tj-grid">
                <h2 className="tj-h2 tj-wide">Emergency contact</h2>
                <Field label="Name" error={errors.emergency_contact_name}>
                  <input value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />
                </Field>
                <Field label="Relationship" hint="Optional.">
                  <input value={form.emergency_contact_relationship} onChange={set('emergency_contact_relationship')} placeholder="Mother, partner, friend" />
                </Field>
                <Field label="Phone" error={errors.emergency_contact_phone}>
                  <input value={form.emergency_contact_phone} onChange={(e) => set('emergency_contact_phone')(formatPhone(e.target.value))} inputMode="tel" />
                </Field>
                <h2 className="tj-h2 tj-wide">How should we reach you?</h2>
                <Field label="Best way" wide>
                  <div className="tj-chips">
                    {REACH.map(([v, l]) => (
                      <button type="button" key={v} className={`tj-chip${form.preferred_contact_method === v ? ' is-on' : ''}`} onClick={() => set('preferred_contact_method')(v)}>{l}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Best time" hint="Optional." wide>
                  <input value={form.best_time_to_reach} onChange={set('best_time_to_reach')} placeholder="Weekdays after 10 AM" />
                </Field>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="tj-grid">
                <h2 className="tj-h2 tj-wide">Read and sign the team agreement</h2>
                <p className="tj-note tj-wide">Scroll to the end to unlock signing. Your name, role and entity are already filled in.</p>
                <div className="tj-doc tj-wide" ref={docRef} onScroll={onDocScroll} tabIndex={0} aria-label="Agreement text">
                  {rendered.split('\n').filter((l) => l.trim()).map((line, i) => (
                    <p key={i} className={i === 0 ? 'tj-doc-title' : /^\d+\.\s|^SCHEDULE A/.test(line) ? 'tj-doc-h' : ''}>{line}</p>
                  ))}
                </div>
                <p className={`tj-readstate tj-wide${readToEnd ? ' is-ok' : ''}`}>{readToEnd ? '✓ You reached the end of the agreement.' : errors.read || 'Keep scrolling to the end.'}</p>

                <Field label="Your initials (Schedule A)" error={errors.initials}>
                  <input value={form.initials} onChange={(e) => set('initials')(e.target.value.toUpperCase().slice(0, 5))} disabled={!readToEnd} autoCapitalize="characters" />
                </Field>
                <Field label="Date signed" hint="Set automatically. It can’t be changed.">
                  <input value={todayLabel(tz)} readOnly className="tj-readonly" />
                </Field>
                <Field label="Type your full legal name to sign" error={errors.typed_signature} wide>
                  <input value={form.typed_signature} onChange={set('typed_signature')} disabled={!readToEnd} placeholder={squash(form.full_name)} />
                </Field>
                <Field label="Draw your signature" error={errors.signature} wide>
                  {readToEnd ? <SignaturePad onChange={setSignature} /> : <div className="tj-sig-locked">Unlocks after you read the agreement.</div>}
                </Field>
                <label className={`tj-check tj-wide${errors.electronic_consent ? ' tj-has-error' : ''}`}>
                  <input type="checkbox" checked={form.electronic_consent} onChange={set('electronic_consent')} disabled={!readToEnd} />
                  <span>I read the full agreement. I agree to sign it electronically, and my typed name and drawn signature are my legal signature.</span>
                </label>
                {errors.electronic_consent ? <span className="tj-error tj-wide">{errors.electronic_consent}</span> : null}
              </div>
            ) : null}

            {serverError ? <p className="tj-alert">{serverError}</p> : null}

            <div className="tj-actions">
              {step > 0 ? <button type="button" className="tj-btn tj-ghost" onClick={() => go(step - 1)}>Back</button> : <span />}
              <button type="submit" className="tj-btn" disabled={status === 'submitting'}>
                {step < LAST ? 'Continue' : status === 'submitting' ? 'Signing…' : 'Sign and submit'}
              </button>
            </div>
          </form>
        ) : null}

        {status === 'done' && result ? (
          <div className="tj-done">
            <div className="tj-seal" aria-hidden="true">✓</div>
            <h2 className="tj-h2">Signed {result.signed_date ? new Date(`${result.signed_date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'today'}</h2>
            <dl className="tj-summary">
              <div><dt>Entity</dt><dd>{result.entity}</dd></div>
              <div><dt>Work email</dt><dd>{result.work_email || 'Saved. Set up once this entity’s email is ready.'}</dd></div>
              <div><dt>Next</dt><dd>Dr. Dorsey’s office approves your access and work email, then reaches out the way you asked.</dd></div>
            </dl>
            {result.copy_url ? (
              <a className="tj-btn" href={result.copy_url}>Download your signed copy (PDF)</a>
            ) : (
              <p className="tj-note">Your signed copy is saved. Dr. Dorsey’s office will send it to you.</p>
            )}
            {result.copy_url ? <p className="tj-note">Save this page or the PDF. The download link keeps working.</p> : null}
          </div>
        ) : null}
      </section>
      <footer className="tj-foot">We never ask for passwords, bank or card numbers, or Social Security numbers on this page.</footer>
    </main>
  );
}
