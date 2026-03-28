"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const SB = "https://dzlmtvodpyhetvektfuo.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bG10dm9kcHloZXR2ZWt0ZnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODQ4NjQsImV4cCI6MjA4NTE2MDg2NH0.qmnWB4aWdb7U8Iod9Hv8PQAOJO3AG0vYEGnPS--kfAo";

const BRAND_WEBSITES = {
  huglife: "https://huglife.us",
  maga: "https://thaoldatlanta.com",
  stush: "https://stushusa.com",
  "forever-futbol": "https://foreverfutbolmuseum.com",
  casper: "https://caspergroupworldwide.com",
  "infinity-water": "https://infinitywaterco.com",
  "pronto-energy": "https://prontoenergydrink.com",
  "good-times": "https://thegoodtimesworldwide.com",
  kollective: "https://thekollectivehospitality.com",
};

const ROLE_LABELS = {
  dj: "DJ Application",
  volunteer: "Volunteer Signup",
  influencer: "Influencer Program",
  vendor: "Vendor Application",
  artist: "Artist Submission",
  blogger: "Press / Blog Credentials",
  sponsor: "Sponsor Inquiry",
  model: "Model Application",
  promoter: "Promoter Application",
  photographer: "Photographer Application",
  ambassador: "Ambassador Program",
  intern: "Internship Application",
  applicant: "Career Application",
};

const ROLE_ICONS = {
  dj: "🎧", volunteer: "🤝", influencer: "📱", vendor: "🏪", artist: "🎨",
  blogger: "📰", sponsor: "💎", model: "📸", promoter: "📣", photographer: "📷",
  ambassador: "⭐", intern: "🎓", applicant: "💼",
};

export default function BrandLanding() {
  const params = useParams();
  const brandSlug = params.brand;
  const brandKey = brandSlug?.replace(/-/g, "_");
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SB}/rest/v1/khg_form_configs?brand_key=eq.${brandKey}&is_active=eq.true&order=role_type.asc`, {
      headers: { apikey: SK, Authorization: `Bearer ${SK}` }
    }).then(r => r.json()).then(d => { setForms(d || []); setLoading(false); });
  }, [brandKey]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4A853", fontFamily: "'DM Sans',sans-serif", fontSize: 14, letterSpacing: 3 }}>
      LOADING...
    </div>
  );

  const C = forms[0]?.brand_color || "#D4A853";
  const logo = forms[0]?.logo_url;
  const website = BRAND_WEBSITES[brandSlug] || "#";
  const brandName = forms[0]?.form_title?.split("—")[0]?.trim() || brandSlug?.replace(/-/g, " ").toUpperCase();

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#0A0A0A", color: "#F0EDE6", minHeight: "100vh", padding: "48px 20px 80px" }}>
      {/* Header with logo */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        {logo && (
          <a href={website} target="_blank" rel="noopener noreferrer">
            <img src={logo} alt={brandName} style={{ height: 80, objectFit: "contain", marginBottom: 20, filter: `drop-shadow(0 4px 24px ${C}40)`, cursor: "pointer" }} />
          </a>
        )}
        <div style={{ fontSize: 11, letterSpacing: 5, color: C, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
          {brandName}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
          JOIN THE TEAM
        </div>
        <div style={{ fontSize: 14, color: "#888", maxWidth: 480, margin: "0 auto" }}>
          Select what you're applying for below. Each form is specific to the role.
        </div>
      </div>

      {/* Form cards */}
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {forms.map(f => (
          <a
            key={f.id}
            href={`/${brandSlug}/${f.role_type}`}
            style={{
              display: "flex", alignItems: "center", gap: 16, padding: "20px 24px",
              borderRadius: 14, background: "rgba(255,255,255,0.03)",
              border: `1px solid ${C}20`, marginBottom: 12,
              textDecoration: "none", transition: "all 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${C}60`; e.currentTarget.style.background = `${C}08`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${C}20`; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
          >
            <div style={{ fontSize: 28, width: 48, textAlign: "center", flexShrink: 0 }}>
              {ROLE_ICONS[f.role_type] || "📋"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#F0EDE6", marginBottom: 4 }}>
                {ROLE_LABELS[f.role_type] || f.role_type.replace(/_/g, " ").toUpperCase()}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                {f.form_subtitle}
              </div>
            </div>
            <div style={{ color: C, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>→</div>
          </a>
        ))}
      </div>

      {/* Back to main website */}
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <a href={website} target="_blank" rel="noopener noreferrer" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "12px 24px", borderRadius: 10,
          border: `1px solid ${C}30`, background: `${C}08`,
          color: C, fontSize: 12, fontWeight: 700, letterSpacing: 2,
          textTransform: "uppercase", textDecoration: "none",
        }}>
          ← VISIT {brandName} WEBSITE
        </a>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 48, fontSize: 9, letterSpacing: 4, color: "#333", textTransform: "uppercase" }}>
        THE KOLLECTIVE HOSPITALITY GROUP
      </div>
    </div>
  );
}
