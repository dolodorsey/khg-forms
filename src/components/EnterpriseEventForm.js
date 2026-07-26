'use client';

import { useMemo, useState } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzlmtvodpyhetvektfuo.supabase.co';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_ekvoOK6QQ05dUZuWgzQfUw_2RgbWPFR';

const FORM_META = {
  rsvp: {
    title: 'Free RSVP',
    subtitle: 'Request complimentary admission before the confirmed arrival deadline. Capacity and entry policies still apply.',
    submit: 'Request free RSVP',
  },
  birthday: {
    title: 'Birthday Celebration',
    subtitle: 'Request birthday admission, a table, a section or a customized group celebration.',
    submit: 'Submit birthday request',
  },
  vendor: {
    title: 'Vendor Application',
    subtitle: 'Apply to sell food, beverages, merchandise, art, beauty products or services.',
    submit: 'Submit vendor application',
  },
  table: {
    title: 'Table Request',
    subtitle: 'Request a table or section. Availability, minimums, deposit and arrival time are confirmed separately.',
    submit: 'Request a table',
  },
  sponsor: {
    title: 'Sponsorship Inquiry',
    subtitle: 'Tell us what your brand wants to activate, reach or accomplish through this event.',
    submit: 'Submit sponsorship inquiry',
  },
  media: {
    title: 'Media & Press Request',
    subtitle: 'Request credentials, interviews, photography access, video access or official coverage.',
    submit: 'Submit media request',
  },
  volunteer: {
    title: 'Volunteer Application',
    subtitle: 'Apply to support guest experience, registration, production, hospitality or event operations.',
    submit: 'Submit volunteer application',
  },
  perform: {
    title: 'Perform or Participate',
    subtitle: 'Apply as a performer, DJ, host, artist, speaker, dancer or programmed experience.',
    submit: 'Submit performance application',
  },
};

const initialCommon = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  event_name: '',
  event_date: '',
  guest_count: '1',
  instagram_handle: '',
  promo_code: '',
  company_name: '',
  sms_consent: true,
};

const initialDetails = {
  arrival_agreement: false,
  birthday_person: '',
  date_of_birth: '',
  package_interest: '',
  table_interest: 'No',
  preferred_arrival: '',
  flyer_photo_url: '',
  vendor_category: '',
  product_description: '',
  space_needed: '10x10',
  electricity_needed: 'No',
  permits_status: '',
  insurance_status: '',
  website_url: '',
  table_tier: '',
  bottle_preferences: '',
  celebration_reason: '',
  industry: '',
  budget_range: '',
  sponsorship_goals: '',
  activation_idea: '',
  decision_timeline: '',
  outlet_name: '',
  coverage_type: '',
  audience_size: '',
  portfolio_url: '',
  interview_requests: '',
  volunteer_area: '',
  volunteer_availability: '',
  volunteer_experience: '',
  stage_name: '',
  act_type: '',
  performance_link: '',
  technical_requirements: '',
  set_length: '',
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

function Input(props) {
  return <input {...props} />;
}

function Select({ children, ...props }) {
  return <select {...props}>{children}</select>;
}

export default function EnterpriseEventForm({ brandName, brandKey, tableName, accent, formType }) {
  const meta = FORM_META[formType] || FORM_META.rsvp;
  const [common, setCommon] = useState(initialCommon);
  const [details, setDetails] = useState(initialDetails);
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  const setCommonValue = (key, value) => setCommon((current) => ({ ...current, [key]: value }));
  const setDetail = (key, value) => setDetails((current) => ({ ...current, [key]: value }));

  const requirementsMet = useMemo(() => {
    const base =
      common.first_name.trim().length >= 1 &&
      common.last_name.trim().length >= 1 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(common.email) &&
      common.phone.replace(/\D/g, '').length >= 10 &&
      Boolean(common.event_date) &&
      state !== 'submitting';

    if (!base) return false;
    if (formType === 'rsvp') return details.arrival_agreement;
    if (formType === 'birthday') return details.birthday_person.trim() && details.package_interest;
    if (formType === 'vendor') return common.company_name.trim() && details.vendor_category && details.product_description.trim();
    if (formType === 'table') return details.table_tier && Number(common.guest_count) > 0;
    if (formType === 'sponsor') return common.company_name.trim() && details.sponsorship_goals.trim();
    if (formType === 'media') return details.outlet_name.trim() && details.coverage_type && details.portfolio_url.trim();
    if (formType === 'volunteer') return details.volunteer_area && details.volunteer_availability.trim();
    if (formType === 'perform') return details.stage_name.trim() && details.act_type && details.performance_link.trim();
    return true;
  }, [common, details, formType, state]);

  const submit = async (event) => {
    event.preventDefault();
    if (!requirementsMet) return;

    setState('submitting');
    setMessage('');

    try {
      const payload = {
        form_type: formType,
        first_name: common.first_name.trim(),
        last_name: common.last_name.trim(),
        email: common.email.trim().toLowerCase(),
        phone: common.phone.trim(),
        event_name: common.event_name.trim() || brandName,
        event_date: common.event_date,
        guest_count: Number(common.guest_count || 1),
        instagram_handle: common.instagram_handle.trim() || null,
        promo_code: common.promo_code.trim() || null,
        company_name: common.company_name.trim() || null,
        details,
        sms_consent: Boolean(common.sms_consent),
        status: 'new',
        source: `${brandKey}-direct-form`,
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'The request could not be submitted.');
      }

      setState('success');
      setMessage(`${meta.title} received. The ${brandName} team will follow up using the information submitted.`);
      setCommon(initialCommon);
      setDetails(initialDetails);
    } catch (error) {
      setState('error');
      setMessage(error.message || 'The request could not be submitted.');
    }
  };

  if (state === 'success') {
    return (
      <main className="event-page" style={{ '--accent': accent }}>
        <section className="event-shell success-card">
          <div className="brand">{brandName}</div>
          <div className="success-icon">✓</div>
          <h1>Submission received</h1>
          <p>{message}</p>
          <button type="button" onClick={() => setState('idle')}>Submit another request</button>
        </section>
        <Styles />
      </main>
    );
  }

  return (
    <main className="event-page" style={{ '--accent': accent }}>
      <section className="event-shell">
        <div className="brand">{brandName}</div>
        <h1>{meta.title}</h1>
        <p className="intro">{meta.subtitle}</p>

        <form onSubmit={submit} noValidate>
          <div className="grid two">
            <Field label="First name"><Input value={common.first_name} onChange={(e) => setCommonValue('first_name', e.target.value)} autoComplete="given-name" required /></Field>
            <Field label="Last name"><Input value={common.last_name} onChange={(e) => setCommonValue('last_name', e.target.value)} autoComplete="family-name" required /></Field>
            <Field label="Email"><Input type="email" value={common.email} onChange={(e) => setCommonValue('email', e.target.value)} autoComplete="email" required /></Field>
            <Field label="Mobile phone"><Input type="tel" value={common.phone} onChange={(e) => setCommonValue('phone', e.target.value)} autoComplete="tel" required /></Field>
            <Field label="Event name" optional><Input value={common.event_name} onChange={(e) => setCommonValue('event_name', e.target.value)} placeholder={brandName} /></Field>
            <Field label="Event date"><Input type="date" value={common.event_date} onChange={(e) => setCommonValue('event_date', e.target.value)} required /></Field>
            <Field label="Instagram handle" optional><Input value={common.instagram_handle} onChange={(e) => setCommonValue('instagram_handle', e.target.value)} placeholder="@username" /></Field>
            <Field label="Guest count"><Input type="number" min="1" max="1000" value={common.guest_count} onChange={(e) => setCommonValue('guest_count', e.target.value)} /></Field>
          </div>

          {formType === 'rsvp' && (
            <FormSection title="RSVP details">
              <div className="grid two">
                <Field label="Promo or referral code" optional><Input value={common.promo_code} onChange={(e) => setCommonValue('promo_code', e.target.value)} /></Field>
                <Field label="Celebrating something?" optional><Input value={details.celebration_reason} onChange={(e) => setDetail('celebration_reason', e.target.value)} /></Field>
              </div>
              <label className="check-row"><input type="checkbox" checked={details.arrival_agreement} onChange={(e) => setDetail('arrival_agreement', e.target.checked)} /><span>I understand free RSVP is subject to capacity and the arrival deadline in my confirmation.</span></label>
            </FormSection>
          )}

          {formType === 'birthday' && (
            <FormSection title="Birthday details">
              <div className="grid two">
                <Field label="Birthday person"><Input value={details.birthday_person} onChange={(e) => setDetail('birthday_person', e.target.value)} required /></Field>
                <Field label="Date of birth" optional><Input type="date" value={details.date_of_birth} onChange={(e) => setDetail('date_of_birth', e.target.value)} /></Field>
                <Field label="Package interest"><Select value={details.package_interest} onChange={(e) => setDetail('package_interest', e.target.value)}><option value="">Select</option><option>Complimentary birthday RSVP</option><option>Birthday table</option><option>Birthday section</option><option>Group celebration</option><option>Need recommendations</option></Select></Field>
                <Field label="Table interest"><Select value={details.table_interest} onChange={(e) => setDetail('table_interest', e.target.value)}><option>No</option><option>Yes</option><option>Maybe</option></Select></Field>
                <Field label="Preferred arrival" optional><Input value={details.preferred_arrival} onChange={(e) => setDetail('preferred_arrival', e.target.value)} /></Field>
                <Field label="Flyer or photo link" optional><Input type="url" value={details.flyer_photo_url} onChange={(e) => setDetail('flyer_photo_url', e.target.value)} /></Field>
              </div>
            </FormSection>
          )}

          {formType === 'vendor' && (
            <FormSection title="Vendor details">
              <div className="grid two">
                <Field label="Business name"><Input value={common.company_name} onChange={(e) => setCommonValue('company_name', e.target.value)} required /></Field>
                <Field label="Vendor category"><Select value={details.vendor_category} onChange={(e) => setDetail('vendor_category', e.target.value)}><option value="">Select</option><option>Food</option><option>Beverage</option><option>Merchandise</option><option>Art</option><option>Beauty</option><option>Services</option><option>Other</option></Select></Field>
                <Field label="Space needed"><Select value={details.space_needed} onChange={(e) => setDetail('space_needed', e.target.value)}><option>10x10</option><option>10x20</option><option>Food truck</option><option>Table only</option><option>Custom</option></Select></Field>
                <Field label="Electricity needed"><Select value={details.electricity_needed} onChange={(e) => setDetail('electricity_needed', e.target.value)}><option>No</option><option>Yes — standard outlet</option><option>Yes — special power</option></Select></Field>
                <Field label="Permit status" optional><Input value={details.permits_status} onChange={(e) => setDetail('permits_status', e.target.value)} /></Field>
                <Field label="Insurance status" optional><Input value={details.insurance_status} onChange={(e) => setDetail('insurance_status', e.target.value)} /></Field>
                <Field label="Website or social link" optional><Input type="url" value={details.website_url} onChange={(e) => setDetail('website_url', e.target.value)} /></Field>
              </div>
              <Field label="Products or services"><textarea rows="5" value={details.product_description} onChange={(e) => setDetail('product_description', e.target.value)} required /></Field>
            </FormSection>
          )}

          {formType === 'table' && (
            <FormSection title="Table details">
              <div className="grid two">
                <Field label="Table or section"><Select value={details.table_tier} onChange={(e) => setDetail('table_tier', e.target.value)}><option value="">Select</option><option>Standard table</option><option>Premium table</option><option>VIP section</option><option>Large group section</option><option>Need recommendations</option></Select></Field>
                <Field label="Preferred arrival" optional><Input value={details.preferred_arrival} onChange={(e) => setDetail('preferred_arrival', e.target.value)} /></Field>
                <Field label="Celebration reason" optional><Input value={details.celebration_reason} onChange={(e) => setDetail('celebration_reason', e.target.value)} /></Field>
                <Field label="Bottle preferences" optional><Input value={details.bottle_preferences} onChange={(e) => setDetail('bottle_preferences', e.target.value)} /></Field>
              </div>
            </FormSection>
          )}

          {formType === 'sponsor' && (
            <FormSection title="Sponsorship details">
              <div className="grid two">
                <Field label="Company or brand"><Input value={common.company_name} onChange={(e) => setCommonValue('company_name', e.target.value)} required /></Field>
                <Field label="Industry" optional><Input value={details.industry} onChange={(e) => setDetail('industry', e.target.value)} /></Field>
                <Field label="Budget range" optional><Select value={details.budget_range} onChange={(e) => setDetail('budget_range', e.target.value)}><option value="">Select</option><option>Under $1,000</option><option>$1,000–$5,000</option><option>$5,000–$15,000</option><option>$15,000–$50,000</option><option>$50,000+</option><option>In-kind or product</option></Select></Field>
                <Field label="Decision timeline" optional><Select value={details.decision_timeline} onChange={(e) => setDetail('decision_timeline', e.target.value)}><option value="">Select</option><option>Immediately</option><option>Within 7 days</option><option>Within 30 days</option><option>Future event</option></Select></Field>
              </div>
              <Field label="Sponsorship goals"><textarea rows="4" value={details.sponsorship_goals} onChange={(e) => setDetail('sponsorship_goals', e.target.value)} required /></Field>
              <Field label="Activation idea" optional><textarea rows="4" value={details.activation_idea} onChange={(e) => setDetail('activation_idea', e.target.value)} /></Field>
            </FormSection>
          )}

          {formType === 'media' && (
            <FormSection title="Media details">
              <div className="grid two">
                <Field label="Outlet or platform"><Input value={details.outlet_name} onChange={(e) => setDetail('outlet_name', e.target.value)} required /></Field>
                <Field label="Coverage type"><Select value={details.coverage_type} onChange={(e) => setDetail('coverage_type', e.target.value)}><option value="">Select</option><option>Photography</option><option>Video recap</option><option>Interview</option><option>Article</option><option>Podcast</option><option>Social coverage</option><option>Other</option></Select></Field>
                <Field label="Audience size" optional><Input value={details.audience_size} onChange={(e) => setDetail('audience_size', e.target.value)} /></Field>
                <Field label="Portfolio or published work"><Input type="url" value={details.portfolio_url} onChange={(e) => setDetail('portfolio_url', e.target.value)} required /></Field>
              </div>
              <Field label="Interview or access requests" optional><textarea rows="4" value={details.interview_requests} onChange={(e) => setDetail('interview_requests', e.target.value)} /></Field>
            </FormSection>
          )}

          {formType === 'volunteer' && (
            <FormSection title="Volunteer details">
              <div className="grid two">
                <Field label="Area of interest"><Select value={details.volunteer_area} onChange={(e) => setDetail('volunteer_area', e.target.value)}><option value="">Select</option><option>Registration</option><option>Guest experience</option><option>Production</option><option>Vendor support</option><option>Artist support</option><option>Hospitality</option><option>Setup or breakdown</option><option>General support</option></Select></Field>
                <Field label="Availability"><Input value={details.volunteer_availability} onChange={(e) => setDetail('volunteer_availability', e.target.value)} placeholder="Times and dates available" required /></Field>
              </div>
              <Field label="Relevant experience" optional><textarea rows="4" value={details.volunteer_experience} onChange={(e) => setDetail('volunteer_experience', e.target.value)} /></Field>
            </FormSection>
          )}

          {formType === 'perform' && (
            <FormSection title="Performance details">
              <div className="grid two">
                <Field label="Stage or act name"><Input value={details.stage_name} onChange={(e) => setDetail('stage_name', e.target.value)} required /></Field>
                <Field label="Act type"><Select value={details.act_type} onChange={(e) => setDetail('act_type', e.target.value)}><option value="">Select</option><option>Artist or band</option><option>DJ</option><option>Host or emcee</option><option>Dancer</option><option>Poet or spoken word</option><option>Comedian</option><option>Speaker</option><option>Fashion</option><option>Other</option></Select></Field>
                <Field label="Performance link"><Input type="url" value={details.performance_link} onChange={(e) => setDetail('performance_link', e.target.value)} required /></Field>
                <Field label="Requested set length" optional><Input value={details.set_length} onChange={(e) => setDetail('set_length', e.target.value)} /></Field>
              </div>
              <Field label="Technical requirements" optional><textarea rows="4" value={details.technical_requirements} onChange={(e) => setDetail('technical_requirements', e.target.value)} /></Field>
            </FormSection>
          )}

          <Field label="Additional notes" optional><textarea rows="4" value={details.notes} onChange={(e) => setDetail('notes', e.target.value)} /></Field>

          <label className="check-row sms"><input type="checkbox" checked={common.sms_consent} onChange={(e) => setCommonValue('sms_consent', e.target.checked)} /><span>I agree to receive confirmation and follow-up messages about this request. Message and data rates may apply.</span></label>

          {state === 'error' ? <div className="error">{message}</div> : null}
          <button type="submit" disabled={!requirementsMet}>{state === 'submitting' ? 'Submitting…' : meta.submit}</button>
        </form>
      </section>
      <Styles />
    </main>
  );
}

function FormSection({ title, children }) {
  return <section className="form-section"><h2>{title}</h2>{children}</section>;
}

function Styles() {
  return (
    <style jsx global>{`
      * { box-sizing: border-box; }
      body { margin: 0; background: #090909; }
      .event-page { min-height: 100vh; padding: 48px 20px 90px; background: radial-gradient(circle at 88% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 32%), #090909; color: #fff; font-family: 'DM Sans', Inter, sans-serif; }
      .event-shell { width: min(920px, 100%); margin: 0 auto; }
      .brand { color: var(--accent); font-size: 12px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
      h1 { margin: 12px 0 14px; font-size: clamp(42px, 8vw, 78px); line-height: .94; letter-spacing: -.055em; }
      .intro { max-width: 720px; margin: 0 0 34px; color: rgba(255,255,255,.66); font-size: 16px; line-height: 1.65; }
      form, .success-card { padding: clamp(22px, 5vw, 42px); border: 1px solid rgba(255,255,255,.12); border-radius: 26px; background: rgba(18,18,18,.94); box-shadow: 0 30px 90px rgba(0,0,0,.45); }
      .grid { display: grid; gap: 18px; }
      .grid.two { grid-template-columns: repeat(2,minmax(0,1fr)); }
      .field { display: block; margin-bottom: 18px; }
      .label { display: block; margin-bottom: 8px; color: rgba(255,255,255,.88); font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
      .label em { color: rgba(255,255,255,.35); font-style: normal; font-weight: 500; text-transform: none; letter-spacing: 0; }
      input, select, textarea { width: 100%; min-height: 48px; padding: 13px 14px; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; background: #171717; color: #fff; font: inherit; outline: none; }
      textarea { min-height: 110px; resize: vertical; }
      input:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent); }
      .form-section { margin: 14px 0 28px; padding: 26px 0 4px; border-top: 1px solid rgba(255,255,255,.1); }
      h2 { margin: 0 0 18px; font-size: 21px; letter-spacing: -.02em; }
      .check-row { display: flex; align-items: flex-start; gap: 11px; padding: 15px; border: 1px solid rgba(255,255,255,.11); border-radius: 12px; background: rgba(255,255,255,.035); color: rgba(255,255,255,.72); font-size: 13px; line-height: 1.5; }
      .check-row input { width: 17px; min-height: 17px; margin: 1px 0 0; accent-color: var(--accent); }
      .check-row.sms { margin-top: 8px; }
      button { width: 100%; margin-top: 22px; padding: 16px 20px; border: 0; border-radius: 13px; background: var(--accent); color: #0b0b0b; font-size: 16px; font-weight: 900; cursor: pointer; }
      button:disabled { opacity: .38; cursor: not-allowed; }
      .error { margin-top: 18px; padding: 13px 15px; border: 1px solid rgba(239,68,68,.4); border-radius: 12px; background: rgba(239,68,68,.12); color: #fecaca; }
      .success-card { margin-top: 12vh; text-align: center; }
      .success-icon { display: grid; place-items: center; width: 68px; height: 68px; margin: 28px auto 18px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); font-size: 36px; }
      .success-card h1 { font-size: clamp(38px, 7vw, 64px); }
      .success-card p { max-width: 620px; margin: 0 auto; color: rgba(255,255,255,.68); line-height: 1.65; }
      @media (max-width: 700px) { .grid.two { grid-template-columns: 1fr; gap: 0; } .event-page { padding-top: 34px; } form, .success-card { border-radius: 20px; } }
    `}</style>
  );
}
