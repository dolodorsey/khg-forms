'use client';

import { useMemo, useState } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzlmtvodpyhetvektfuo.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImR6bG10dm9kcHloZXR2ZWt0ZnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODQ4NjQsImV4cCI6MjA4NTE2MDg2NH0.qmnWB4aWdb7U8Iod9Hv8PQAOJO3AG0vYEGnPS--kfAo';

const INQUIRIES = {
  'bulk-water': {
    eyebrow: 'Commercial Water Supply',
    title: 'Bulk Water Request',
    description: 'Request raw, treated or potable water for commercial, industrial, agricultural or project use.',
    submit: 'Submit bulk water request',
  },
  municipal: {
    eyebrow: 'Public-Sector Supply',
    title: 'Municipal Inquiry',
    description: 'Start a conversation about municipal supply, emergency capacity, infrastructure support or long-term procurement.',
    submit: 'Submit municipal inquiry',
  },
  'data-centers': {
    eyebrow: 'Mission-Critical Infrastructure',
    title: 'Data Center Water Inquiry',
    description: 'Share cooling, make-up water, redundancy and delivery requirements for a data center or digital infrastructure project.',
    submit: 'Submit data center inquiry',
  },
  'private-label': {
    eyebrow: 'Packaged Water Programs',
    title: 'Private-Label Water Inquiry',
    description: 'Request sourcing, bottle formats, volume planning and fulfillment support for a branded packaged-water program.',
    submit: 'Submit private-label inquiry',
  },
  'emergency-supply': {
    eyebrow: 'Rapid Water Response',
    title: 'Emergency Supply Request',
    description: 'Request urgent water capacity for disaster response, outages, institutions, communities or commercial continuity.',
    submit: 'Submit emergency supply request',
  },
  distribution: {
    eyebrow: 'Channel Expansion',
    title: 'Distribution Inquiry',
    description: 'Apply to distribute, resell, transport or represent Everyday Water Group products and supply services.',
    submit: 'Submit distribution inquiry',
  },
  partner: {
    eyebrow: 'Strategic Relationships',
    title: 'Partnership Inquiry',
    description: 'Propose a sourcing, infrastructure, logistics, bottling, investment or strategic operating partnership.',
    submit: 'Submit partnership inquiry',
  },
  'request-information': {
    eyebrow: 'Everyday Water Group',
    title: 'Request Information',
    description: 'Tell us what you are evaluating and the correct division will respond with the next step.',
    submit: 'Request information',
  },
};

const initialForm = {
  contact_name: '',
  job_title: '',
  company_name: '',
  email: '',
  phone: '',
  project_location: '',
  desired_start_date: '',
  estimated_volume_gallons: '',
  frequency: '',
  water_requirements: '',
  delivery_method: '',
  procurement_stage: '',
};

const initialDetails = {
  organization_type: '',
  water_type: '',
  intended_use: '',
  current_supplier: '',
  delivery_window: '',
  storage_capacity: '',
  redundancy_requirement: '',
  cooling_system: '',
  bottle_sizes: '',
  packaging_format: '',
  annual_units: '',
  emergency_reason: '',
  deadline: '',
  service_territory: '',
  fleet_capacity: '',
  partnership_type: '',
  budget_or_contract_value: '',
  certifications_required: '',
  decision_makers: '',
  notes: '',
};

function Field({ label, optional = false, children }) {
  return (
    <label className="field">
      <span className="label">{label}{optional ? <em> optional</em> : null}</span>
      {children}
    </label>
  );
}

export default function WaterInquiryForm({ inquiryType }) {
  const meta = INQUIRIES[inquiryType] || INQUIRIES['request-information'];
  const [form, setForm] = useState(initialForm);
  const [details, setDetails] = useState(initialDetails);
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setDetail = (key, value) => setDetails((current) => ({ ...current, [key]: value }));

  const canSubmit = useMemo(() => {
    const base =
      form.contact_name.trim().length >= 2 &&
      form.company_name.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
      form.phone.replace(/\D/g, '').length >= 10 &&
      form.project_location.trim().length >= 2 &&
      state !== 'submitting';

    if (!base) return false;
    if (inquiryType === 'bulk-water') return form.estimated_volume_gallons && details.intended_use.trim();
    if (inquiryType === 'municipal') return details.organization_type && details.intended_use.trim();
    if (inquiryType === 'data-centers') return details.cooling_system && details.redundancy_requirement;
    if (inquiryType === 'private-label') return details.bottle_sizes.trim() && details.annual_units.trim();
    if (inquiryType === 'emergency-supply') return details.emergency_reason.trim() && details.deadline;
    if (inquiryType === 'distribution') return details.service_territory.trim() && details.fleet_capacity.trim();
    if (inquiryType === 'partner') return details.partnership_type && details.notes.trim();
    return details.notes.trim().length >= 10;
  }, [details, form, inquiryType, state]);

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setState('submitting');
    setMessage('');

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/everyday_water_group_inquiries`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          inquiry_type: inquiryType,
          contact_name: form.contact_name.trim(),
          job_title: form.job_title.trim() || null,
          company_name: form.company_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          project_location: form.project_location.trim(),
          desired_start_date: form.desired_start_date || null,
          estimated_volume_gallons: form.estimated_volume_gallons ? Number(form.estimated_volume_gallons) : null,
          frequency: form.frequency || null,
          water_requirements: form.water_requirements.trim() || null,
          delivery_method: form.delivery_method || null,
          procurement_stage: form.procurement_stage || null,
          details,
          status: 'new',
          source: 'everyday-water-group-direct-form',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'The inquiry could not be submitted.');
      }

      setState('success');
      setMessage('Your inquiry has been routed to Everyday Water Group for qualification and follow-up.');
      setForm(initialForm);
      setDetails(initialDetails);
    } catch (error) {
      setState('error');
      setMessage(error.message || 'The inquiry could not be submitted.');
    }
  };

  if (state === 'success') {
    return (
      <main className="water-page">
        <section className="water-shell success-card">
          <div className="wordmark">EVERYDAY WATER GROUP</div>
          <div className="success-icon">✓</div>
          <h1>Inquiry received</h1>
          <p>{message}</p>
          <button type="button" onClick={() => setState('idle')}>Submit another inquiry</button>
        </section>
        <Styles />
      </main>
    );
  }

  return (
    <main className="water-page">
      <section className="water-shell">
        <div className="wordmark">EVERYDAY WATER GROUP</div>
        <div className="eyebrow">{meta.eyebrow}</div>
        <h1>{meta.title}</h1>
        <p className="intro">{meta.description}</p>

        <form onSubmit={submit} noValidate>
          <h2>Organization and contact</h2>
          <div className="grid two">
            <Field label="Contact name"><input value={form.contact_name} onChange={(e) => setValue('contact_name', e.target.value)} autoComplete="name" required /></Field>
            <Field label="Job title" optional><input value={form.job_title} onChange={(e) => setValue('job_title', e.target.value)} /></Field>
            <Field label="Company or organization"><input value={form.company_name} onChange={(e) => setValue('company_name', e.target.value)} autoComplete="organization" required /></Field>
            <Field label="Organization type" optional>
              <select value={details.organization_type} onChange={(e) => setDetail('organization_type', e.target.value)}>
                <option value="">Select</option>
                <option>Private company</option><option>Municipality</option><option>Government agency</option><option>Utility</option><option>Data center developer</option><option>Manufacturer</option><option>Distributor</option><option>Nonprofit</option><option>Other</option>
              </select>
            </Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(e) => setValue('email', e.target.value)} autoComplete="email" required /></Field>
            <Field label="Phone"><input type="tel" value={form.phone} onChange={(e) => setValue('phone', e.target.value)} autoComplete="tel" required /></Field>
          </div>

          <section className="section">
            <h2>Project requirements</h2>
            <div className="grid two">
              <Field label="Project or delivery location"><input value={form.project_location} onChange={(e) => setValue('project_location', e.target.value)} placeholder="City, state or full project area" required /></Field>
              <Field label="Desired start date" optional><input type="date" value={form.desired_start_date} onChange={(e) => setValue('desired_start_date', e.target.value)} /></Field>
              <Field label="Estimated volume in gallons" optional><input type="number" min="1" step="1" value={form.estimated_volume_gallons} onChange={(e) => setValue('estimated_volume_gallons', e.target.value)} /></Field>
              <Field label="Frequency" optional>
                <select value={form.frequency} onChange={(e) => setValue('frequency', e.target.value)}>
                  <option value="">Select</option><option>One-time</option><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Seasonal</option><option>Long-term contract</option><option>Emergency / immediate</option>
                </select>
              </Field>
              <Field label="Water type" optional>
                <select value={details.water_type} onChange={(e) => setDetail('water_type', e.target.value)}>
                  <option value="">Select</option><option>Raw source water</option><option>Treated bulk water</option><option>Potable drinking water</option><option>Spring water</option><option>Purified water</option><option>Packaged water</option><option>Not sure</option>
                </select>
              </Field>
              <Field label="Delivery method" optional>
                <select value={form.delivery_method} onChange={(e) => setValue('delivery_method', e.target.value)}>
                  <option value="">Select</option><option>Tanker delivery</option><option>Bulk loading / customer pickup</option><option>Pipeline or onsite infrastructure</option><option>Packaged freight</option><option>Containerized emergency supply</option><option>Need recommendation</option>
                </select>
              </Field>
              <Field label="Procurement stage" optional>
                <select value={form.procurement_stage} onChange={(e) => setValue('procurement_stage', e.target.value)}>
                  <option value="">Select</option><option>Researching</option><option>Budgeting</option><option>Requesting quotes</option><option>RFP / procurement</option><option>Ready to contract</option><option>Urgent replacement supplier</option>
                </select>
              </Field>
              <Field label="Estimated budget or contract value" optional><input value={details.budget_or_contract_value} onChange={(e) => setDetail('budget_or_contract_value', e.target.value)} placeholder="Example: $250,000 annual contract" /></Field>
            </div>
            <Field label="Water specifications or certifications" optional><textarea rows="4" value={form.water_requirements} onChange={(e) => setValue('water_requirements', e.target.value)} placeholder="Treatment, quality, testing, compliance, temperature or other requirements" /></Field>
          </section>

          {inquiryType === 'bulk-water' && (
            <section className="section"><h2>Bulk supply details</h2><div className="grid two"><Field label="Intended use"><input value={details.intended_use} onChange={(e) => setDetail('intended_use', e.target.value)} required /></Field><Field label="Current supplier" optional><input value={details.current_supplier} onChange={(e) => setDetail('current_supplier', e.target.value)} /></Field><Field label="Storage capacity" optional><input value={details.storage_capacity} onChange={(e) => setDetail('storage_capacity', e.target.value)} /></Field><Field label="Delivery window" optional><input value={details.delivery_window} onChange={(e) => setDetail('delivery_window', e.target.value)} /></Field></div></section>
          )}

          {inquiryType === 'municipal' && (
            <section className="section"><h2>Municipal scope</h2><Field label="Program, infrastructure or community need"><textarea rows="5" value={details.intended_use} onChange={(e) => setDetail('intended_use', e.target.value)} required /></Field><div className="grid two"><Field label="Required certifications" optional><input value={details.certifications_required} onChange={(e) => setDetail('certifications_required', e.target.value)} /></Field><Field label="Decision makers or procurement contacts" optional><input value={details.decision_makers} onChange={(e) => setDetail('decision_makers', e.target.value)} /></Field></div></section>
          )}

          {inquiryType === 'data-centers' && (
            <section className="section"><h2>Data center requirements</h2><div className="grid two"><Field label="Cooling system"><select value={details.cooling_system} onChange={(e) => setDetail('cooling_system', e.target.value)}><option value="">Select</option><option>Evaporative cooling</option><option>Cooling towers</option><option>Closed-loop liquid cooling</option><option>Hybrid system</option><option>Design in progress</option><option>Other</option></select></Field><Field label="Redundancy requirement"><select value={details.redundancy_requirement} onChange={(e) => setDetail('redundancy_requirement', e.target.value)}><option value="">Select</option><option>Primary source</option><option>Secondary / backup source</option><option>Emergency reserve</option><option>Multiple-source strategy</option></select></Field><Field label="Storage capacity" optional><input value={details.storage_capacity} onChange={(e) => setDetail('storage_capacity', e.target.value)} /></Field><Field label="Delivery window" optional><input value={details.delivery_window} onChange={(e) => setDetail('delivery_window', e.target.value)} /></Field></div></section>
          )}

          {inquiryType === 'private-label' && (
            <section className="section"><h2>Private-label program</h2><div className="grid two"><Field label="Bottle sizes and formats"><input value={details.bottle_sizes} onChange={(e) => setDetail('bottle_sizes', e.target.value)} placeholder="Example: 12 oz aluminum, 16.9 oz PET" required /></Field><Field label="Estimated annual units"><input value={details.annual_units} onChange={(e) => setDetail('annual_units', e.target.value)} required /></Field><Field label="Packaging format" optional><input value={details.packaging_format} onChange={(e) => setDetail('packaging_format', e.target.value)} placeholder="Cases, pallets, direct-to-consumer" /></Field><Field label="Required certifications" optional><input value={details.certifications_required} onChange={(e) => setDetail('certifications_required', e.target.value)} /></Field></div></section>
          )}

          {inquiryType === 'emergency-supply' && (
            <section className="section emergency"><h2>Emergency requirements</h2><Field label="What happened and who needs water?"><textarea rows="5" value={details.emergency_reason} onChange={(e) => setDetail('emergency_reason', e.target.value)} required /></Field><div className="grid two"><Field label="Required delivery deadline"><input type="datetime-local" value={details.deadline} onChange={(e) => setDetail('deadline', e.target.value)} required /></Field><Field label="Delivery window or site restrictions" optional><input value={details.delivery_window} onChange={(e) => setDetail('delivery_window', e.target.value)} /></Field></div><p className="urgent-note">Submitting this form does not guarantee emergency fulfillment. For an immediate threat to life or public safety, contact the appropriate emergency authority.</p></section>
          )}

          {inquiryType === 'distribution' && (
            <section className="section"><h2>Distribution capability</h2><div className="grid two"><Field label="Service territory"><input value={details.service_territory} onChange={(e) => setDetail('service_territory', e.target.value)} required /></Field><Field label="Fleet, warehouse or channel capacity"><input value={details.fleet_capacity} onChange={(e) => setDetail('fleet_capacity', e.target.value)} required /></Field><Field label="Current product categories" optional><input value={details.current_supplier} onChange={(e) => setDetail('current_supplier', e.target.value)} /></Field><Field label="Certifications or licenses" optional><input value={details.certifications_required} onChange={(e) => setDetail('certifications_required', e.target.value)} /></Field></div></section>
          )}

          {inquiryType === 'partner' && (
            <section className="section"><h2>Partnership proposal</h2><Field label="Partnership type"><select value={details.partnership_type} onChange={(e) => setDetail('partnership_type', e.target.value)}><option value="">Select</option><option>Water source / land</option><option>Infrastructure</option><option>Transportation / logistics</option><option>Treatment</option><option>Bottling / packaging</option><option>Distribution</option><option>Investment / financing</option><option>Government / institutional</option><option>Other</option></select></Field><Field label="Proposed relationship and opportunity"><textarea rows="6" value={details.notes} onChange={(e) => setDetail('notes', e.target.value)} required /></Field></section>
          )}

          {inquiryType === 'request-information' && (
            <section className="section"><h2>What do you need?</h2><Field label="Question, opportunity or requirement"><textarea rows="6" value={details.notes} onChange={(e) => setDetail('notes', e.target.value)} required /></Field></section>
          )}

          {inquiryType !== 'partner' && inquiryType !== 'request-information' && <Field label="Additional details" optional><textarea rows="5" value={details.notes} onChange={(e) => setDetail('notes', e.target.value)} /></Field>}

          {state === 'error' && <div className="error">{message}</div>}
          <button type="submit" disabled={!canSubmit}>{state === 'submitting' ? 'Submitting…' : meta.submit}</button>
          <p className="privacy">Information is used to qualify and respond to this Everyday Water Group inquiry. Submission does not create a supply commitment or contract.</p>
        </form>
      </section>
      <Styles />
    </main>
  );
}

function Styles() {
  return <style jsx global>{`
    * { box-sizing: border-box; }
    body { margin: 0; background: #04131a; }
    .water-page { min-height: 100vh; padding: 54px 20px 96px; background: radial-gradient(circle at 90% 0%, rgba(23,171,190,.2), transparent 36%), linear-gradient(180deg,#04131a,#061d25 55%,#04131a); color: #f4fbfc; font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; }
    .water-shell { width: min(980px,100%); margin: 0 auto; }
    .wordmark { display: inline-flex; padding: 8px 12px; border: 1px solid rgba(133,221,232,.28); border-radius: 999px; color: #8bdce7; font-size: 11px; font-weight: 900; letter-spacing: .18em; }
    .eyebrow { margin-top: 32px; color: #37bfd1; font-size: 12px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; }
    h1 { margin: 10px 0 14px; max-width: 820px; font-size: clamp(44px,8vw,82px); line-height: .94; letter-spacing: -.055em; }
    .intro { max-width: 760px; margin: 0 0 34px; color: rgba(228,247,249,.68); font-size: 17px; line-height: 1.65; }
    form, .success-card { padding: clamp(22px,5vw,44px); border: 1px solid rgba(139,220,231,.14); border-radius: 26px; background: rgba(5,25,33,.92); box-shadow: 0 34px 100px rgba(0,0,0,.42); }
    h2 { margin: 0 0 20px; font-size: 21px; letter-spacing: -.02em; }
    .section { margin: 30px 0; padding-top: 30px; border-top: 1px solid rgba(139,220,231,.12); }
    .section.emergency { padding: 24px; border: 1px solid rgba(245,158,11,.24); border-radius: 18px; background: rgba(245,158,11,.05); }
    .grid { display: grid; gap: 18px; }
    .grid.two { grid-template-columns: repeat(2,minmax(0,1fr)); }
    .field { display: block; margin-bottom: 18px; }
    .label { display: block; margin-bottom: 8px; color: rgba(244,251,252,.88); font-size: 12px; font-weight: 850; letter-spacing: .04em; text-transform: uppercase; }
    .label em { color: rgba(244,251,252,.38); font-style: normal; font-weight: 500; letter-spacing: 0; text-transform: none; }
    input, select, textarea { width: 100%; min-height: 49px; padding: 13px 14px; border: 1px solid rgba(139,220,231,.16); border-radius: 12px; background: #0a2630; color: #fff; font: inherit; outline: none; }
    textarea { min-height: 115px; resize: vertical; }
    input:focus, select:focus, textarea:focus { border-color: #37bfd1; box-shadow: 0 0 0 3px rgba(55,191,209,.13); }
    button { width: 100%; margin-top: 20px; padding: 17px 22px; border: 0; border-radius: 13px; background: linear-gradient(135deg,#45cddd,#168da0); color: #031116; font-size: 16px; font-weight: 900; cursor: pointer; }
    button:disabled { opacity: .36; cursor: not-allowed; }
    .error { margin-top: 18px; padding: 14px; border: 1px solid rgba(248,113,113,.35); border-radius: 12px; background: rgba(248,113,113,.1); color: #fecaca; }
    .privacy, .urgent-note { color: rgba(228,247,249,.48); font-size: 11px; line-height: 1.6; }
    .urgent-note { color: #f8d59a; }
    .success-card { margin-top: 10vh; text-align: center; }
    .success-icon { display: grid; place-items: center; width: 70px; height: 70px; margin: 28px auto 16px; border-radius: 50%; background: rgba(55,191,209,.15); color: #67e0ed; font-size: 36px; }
    .success-card h1 { margin-inline: auto; font-size: clamp(40px,7vw,66px); }
    .success-card p { max-width: 620px; margin: 0 auto; color: rgba(228,247,249,.68); line-height: 1.65; }
    @media (max-width: 720px) { .grid.two { grid-template-columns: 1fr; gap: 0; } .water-page { padding-top: 34px; } form, .success-card { border-radius: 20px; } }
  `}</style>;
}
