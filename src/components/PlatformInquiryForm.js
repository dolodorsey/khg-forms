'use client';

import { useMemo, useState } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzlmtvodpyhetvektfuo.supabase.co';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_ekvoOK6QQ05dUZuWgzQfUw_2RgbWPFR';

const initial = {
  full_name: '',
  email: '',
  phone: '',
  organization: '',
  location: '',
  preferred_date: '',
  quantity_or_group_size: '',
  category_or_role: '',
  budget: '',
  website: '',
  details: '',
  sms_consent: true,
};

export default function PlatformInquiryForm({ slug, platform, formSlug }) {
  const [label, description] = platform.forms[formSlug];
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const canSubmit = useMemo(() => (
    form.full_name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.phone.replace(/\D/g, '').length >= 10 &&
    form.details.trim().length >= 10 &&
    status !== 'submitting'
  ), [form, status]);

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${platform.tableName}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          form_type: formSlug,
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          organization: form.organization.trim() || null,
          location: form.location.trim() || null,
          details: {
            preferred_date: form.preferred_date || null,
            quantity_or_group_size: form.quantity_or_group_size.trim() || null,
            category_or_role: form.category_or_role.trim() || null,
            budget: form.budget.trim() || null,
            website: form.website.trim() || null,
            message: form.details.trim(),
          },
          consent: Boolean(form.sms_consent),
          status: 'new',
          source: platform.source,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Your request could not be submitted.');
      }

      setStatus('success');
      setMessage(`Your ${label.toLowerCase()} request was received and routed to the correct team.`);
      setForm(initial);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Your request could not be submitted.');
    }
  };

  if (status === 'success') {
    return (
      <Page accent={platform.accent}>
        <section style={styles.card}>
          <div style={{ ...styles.brand, color: platform.accent }}>{platform.name}</div>
          <div style={{ ...styles.successIcon, color: platform.accent, background: `${platform.accent}20` }}>✓</div>
          <h1 style={styles.successTitle}>Request received</h1>
          <p style={styles.centerCopy}>{message}</p>
          <a href={`/${slug}`} style={{ ...styles.primaryLink, background: platform.accent }}>Return to {platform.name}</a>
        </section>
      </Page>
    );
  }

  return (
    <Page accent={platform.accent}>
      <section style={styles.shell}>
        <a href={`/${slug}`} style={styles.back}>← {platform.name}</a>
        <div style={{ ...styles.eyebrow, color: platform.accent }}>{platform.eyebrow}</div>
        <h1 style={styles.title}>{label}</h1>
        <p style={styles.description}>{description}</p>

        <form onSubmit={submit} style={styles.card}>
          <div style={styles.grid}>
            <Field label="Full name"><input value={form.full_name} onChange={(event) => update('full_name', event.target.value)} autoComplete="name" required style={styles.input} /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" required style={styles.input} /></Field>
            <Field label="Mobile phone"><input type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" required style={styles.input} /></Field>
            <Field label="Organization / company" optional><input value={form.organization} onChange={(event) => update('organization', event.target.value)} autoComplete="organization" style={styles.input} /></Field>
            <Field label="City / location" optional><input value={form.location} onChange={(event) => update('location', event.target.value)} style={styles.input} /></Field>
            <Field label="Preferred date" optional><input type="date" value={form.preferred_date} onChange={(event) => update('preferred_date', event.target.value)} style={styles.input} /></Field>
            <Field label="Quantity / group size" optional><input value={form.quantity_or_group_size} onChange={(event) => update('quantity_or_group_size', event.target.value)} style={styles.input} /></Field>
            <Field label="Program / role / category" optional><input value={form.category_or_role} onChange={(event) => update('category_or_role', event.target.value)} style={styles.input} /></Field>
            <Field label="Budget / contract range" optional><input value={form.budget} onChange={(event) => update('budget', event.target.value)} placeholder="Example: $5,000" style={styles.input} /></Field>
            <Field label="Website / social link" optional><input type="url" value={form.website} onChange={(event) => update('website', event.target.value)} style={styles.input} /></Field>
          </div>

          <Field label="Tell us what you need"><textarea rows="6" value={form.details} onChange={(event) => update('details', event.target.value)} required style={styles.textarea} /></Field>

          <label style={styles.consent}>
            <input type="checkbox" checked={form.sms_consent} onChange={(event) => update('sms_consent', event.target.checked)} style={{ accentColor: platform.accent }} />
            <span>I agree to receive confirmation and follow-up messages about this request. Message and data rates may apply.</span>
          </label>

          {status === 'error' && <div style={styles.error}>{message}</div>}
          <button type="submit" disabled={!canSubmit} style={{ ...styles.button, background: platform.accent, opacity: canSubmit ? 1 : .4 }}>
            {status === 'submitting' ? 'Submitting…' : `Submit ${label}`}
          </button>
          <p style={styles.disclaimer}>{platform.disclaimer}</p>
        </form>
      </section>
    </Page>
  );
}

function Page({ children, accent }) {
  return <main style={{ ...styles.page, '--accent': accent }}>{children}</main>;
}

function Field({ label, optional = false, children }) {
  return <label style={styles.field}><span style={styles.label}>{label}{optional ? ' · optional' : ''}</span>{children}</label>;
}

const styles = {
  page: { minHeight: '100vh', padding: '44px 20px 90px', background: 'radial-gradient(circle at 88% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 35%), #090909', color: '#fff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' },
  shell: { width: 'min(900px,100%)', margin: '0 auto' },
  back: { color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontSize: 12 },
  eyebrow: { marginTop: 36, fontSize: 10, fontWeight: 900, letterSpacing: '.2em' },
  title: { margin: '12px 0 10px', fontFamily: 'Georgia, serif', fontSize: 'clamp(48px,8vw,82px)', fontWeight: 400, lineHeight: .94, letterSpacing: '-.05em' },
  description: { maxWidth: 700, margin: '0 0 28px', color: 'rgba(255,255,255,.65)', fontSize: 16, lineHeight: 1.65 },
  card: { width: 'min(900px,100%)', margin: '0 auto', padding: 'clamp(22px,5vw,42px)', border: '1px solid rgba(255,255,255,.11)', borderRadius: 23, background: 'rgba(18,18,18,.94)', boxShadow: '0 30px 90px rgba(0,0,0,.4)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 },
  field: { display: 'block', marginBottom: 16 },
  label: { display: 'block', marginBottom: 7, color: 'rgba(255,255,255,.82)', fontSize: 10, fontWeight: 850, letterSpacing: '.09em', textTransform: 'uppercase' },
  input: { width: '100%', boxSizing: 'border-box', padding: '13px 14px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, background: '#171717', color: '#fff', font: 'inherit', fontSize: 16 },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '13px 14px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, background: '#171717', color: '#fff', font: 'inherit', fontSize: 16, resize: 'vertical' },
  consent: { display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 8, color: 'rgba(255,255,255,.55)', fontSize: 12, lineHeight: 1.5 },
  button: { width: '100%', marginTop: 22, padding: '16px 20px', border: 0, borderRadius: 11, color: '#090909', fontSize: 15, fontWeight: 900, cursor: 'pointer' },
  error: { marginTop: 16, padding: 12, border: '1px solid rgba(239,68,68,.35)', borderRadius: 10, background: 'rgba(239,68,68,.12)', color: '#FCA5A5', fontSize: 13 },
  disclaimer: { margin: '17px 0 0', color: 'rgba(255,255,255,.36)', fontSize: 10, lineHeight: 1.65, textAlign: 'center' },
  brand: { textAlign: 'center', fontSize: 11, fontWeight: 900, letterSpacing: '.22em' },
  successIcon: { display: 'grid', placeItems: 'center', width: 70, height: 70, margin: '26px auto 18px', borderRadius: '50%', fontSize: 36 },
  successTitle: { margin: '0 0 10px', fontFamily: 'Georgia, serif', fontSize: 48, fontWeight: 400, textAlign: 'center' },
  centerCopy: { maxWidth: 620, margin: '0 auto', color: 'rgba(255,255,255,.65)', lineHeight: 1.65, textAlign: 'center' },
  primaryLink: { display: 'flex', justifyContent: 'center', marginTop: 24, padding: 14, borderRadius: 10, color: '#090909', textDecoration: 'none', fontWeight: 900 },
};
