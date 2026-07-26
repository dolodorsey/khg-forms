import { notFound } from 'next/navigation';
import { getEventBrand } from '../../../lib/eventBrands';

const PRIMARY_ACTIONS = [
  { slug: 'rsvp', label: 'Free RSVP', detail: 'Request complimentary admission before the arrival deadline.' },
  { slug: 'birthdays', label: 'Celebrate a Birthday', detail: 'Request birthday admission, tables, sections or group packages.' },
  { slug: 'vendor', label: 'Become a Vendor', detail: 'Apply for food, merchandise, art, beauty or service placement.' },
];

const SECONDARY_ACTIONS = [
  { slug: 'tables', label: 'Tables & Sections' },
  { slug: 'sponsor', label: 'Sponsorship' },
  { slug: 'media', label: 'Media & Press' },
  { slug: 'volunteer', label: 'Volunteer' },
  { slug: 'perform', label: 'Perform or Participate' },
];

export default function EventFormsHubPage({ params }) {
  const brand = getEventBrand(params.brand);
  if (!brand) notFound();

  return (
    <main className="hub" style={{ '--accent': brand.accent }}>
      <section className="shell">
        <div className="brand">{brand.name}</div>
        <h1>Choose your next move.</h1>
        <p className="intro">Direct requests are routed to the {brand.name} team without mixing this brand’s submissions with another event.</p>

        <div className="primary-grid">
          {PRIMARY_ACTIONS.map((action) => (
            <a href={`/events/${params.brand}/${action.slug}`} className="primary-card" key={action.slug}>
              <span>{action.label}</span>
              <small>{action.detail}</small>
              <strong>Open form →</strong>
            </a>
          ))}
        </div>

        <div className="secondary-grid">
          {SECONDARY_ACTIONS.map((action) => (
            <a href={`/events/${params.brand}/${action.slug}`} key={action.slug}>{action.label}</a>
          ))}
        </div>
      </section>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #090909; }
        .hub { min-height: 100vh; padding: 58px 20px 90px; background: radial-gradient(circle at 88% 0%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 35%), #090909; color: #fff; font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; }
        .shell { width: min(1040px,100%); margin: 0 auto; }
        .brand { color: var(--accent); font-size: 12px; font-weight: 900; letter-spacing: .2em; text-transform: uppercase; }
        h1 { max-width: 760px; margin: 14px 0; font-size: clamp(48px,9vw,92px); line-height: .9; letter-spacing: -.06em; }
        .intro { max-width: 690px; margin: 0 0 34px; color: rgba(255,255,255,.65); font-size: 17px; line-height: 1.65; }
        .primary-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; }
        .primary-card { min-height: 220px; padding: 24px; border: 1px solid rgba(255,255,255,.12); border-radius: 22px; background: rgba(18,18,18,.92); color: #fff; text-decoration: none; display: flex; flex-direction: column; box-shadow: 0 24px 70px rgba(0,0,0,.32); }
        .primary-card span { font-size: 25px; font-weight: 900; letter-spacing: -.03em; }
        .primary-card small { margin-top: 12px; color: rgba(255,255,255,.58); font-size: 13px; line-height: 1.55; }
        .primary-card strong { margin-top: auto; color: var(--accent); font-size: 13px; }
        .secondary-grid { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 10px; margin-top: 18px; }
        .secondary-grid a { padding: 14px 10px; border: 1px solid rgba(255,255,255,.1); border-radius: 12px; background: rgba(255,255,255,.035); color: rgba(255,255,255,.8); text-align: center; text-decoration: none; font-size: 12px; font-weight: 800; }
        a:hover { border-color: var(--accent); }
        @media (max-width: 780px) { .primary-grid { grid-template-columns: 1fr; } .primary-card { min-height: 170px; } .secondary-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
      `}</style>
    </main>
  );
}
