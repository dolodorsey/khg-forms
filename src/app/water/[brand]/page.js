import { notFound } from 'next/navigation';
import { getWaterBrand, WATER_INQUIRY_META } from '../../../lib/activeWaterBrands';

export default function ActiveWaterHub({ params }) {
  const brand = getWaterBrand(params.brand);
  if (!brand) notFound();
  return (
    <main className="hub" style={{ '--accent': brand.accent }}>
      <section className="shell">
        <div className="brand">{brand.name}</div>
        <h1>Start the right conversation.</h1>
        <p className="intro">Each inquiry is routed directly to {brand.name} and stored separately from every other brand.</p>
        <div className="grid">
          {brand.inquiryTypes.map((type) => {
            const meta = WATER_INQUIRY_META[type];
            return <a key={type} href={`/water/${params.brand}/${type}`}><span>{meta.title}</span><small>{meta.description}</small><strong>Open form →</strong></a>;
          })}
        </div>
      </section>
      <style jsx global>{`
        *{box-sizing:border-box}body{margin:0;background:#04131a}.hub{min-height:100vh;padding:58px 20px 90px;background:radial-gradient(circle at 88% 0%,color-mix(in srgb,var(--accent) 24%,transparent),transparent 35%),#04131a;color:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}.shell{width:min(1080px,100%);margin:0 auto}.brand{color:var(--accent);font-size:12px;font-weight:900;letter-spacing:.2em}.hub h1{max-width:840px;margin:14px 0;font-size:clamp(48px,9vw,92px);line-height:.9;letter-spacing:-.06em}.intro{max-width:690px;margin:0 0 34px;color:rgba(255,255,255,.65);font-size:17px;line-height:1.65}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.grid a{min-height:210px;padding:24px;border:1px solid rgba(255,255,255,.12);border-radius:20px;background:rgba(5,25,33,.92);color:#fff;text-decoration:none;display:flex;flex-direction:column}.grid a:hover{border-color:var(--accent)}.grid span{font-size:23px;font-weight:900;letter-spacing:-.03em}.grid small{margin-top:12px;color:rgba(255,255,255,.58);font-size:13px;line-height:1.55}.grid strong{margin-top:auto;color:var(--accent);font-size:13px}@media(max-width:800px){.grid{grid-template-columns:1fr}.grid a{min-height:165px}}
      `}</style>
    </main>
  );
}
