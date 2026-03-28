"use client";
import { useState, useEffect } from "react";
const SB = "https://dzlmtvodpyhetvektfuo.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bG10dm9kcHloZXR2ZWt0ZnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODQ4NjQsImV4cCI6MjA4NTE2MDg2NH0.qmnWB4aWdb7U8Iod9Hv8PQAOJO3AG0vYEGnPS--kfAo";
export default function Home() {
  const [configs, setConfigs] = useState([]);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    fetch(`${SB}/rest/v1/khg_form_configs?is_active=eq.true&order=brand_key.asc,role_type.asc`, {
      headers: { apikey: SK, Authorization: `Bearer ${SK}` }
    }).then(r => r.json()).then(setConfigs);
  }, []);
  const brands = [...new Set(configs.map(c => c.brand_key))].sort();
  const filtered = filter === "all" ? configs : configs.filter(c => c.brand_key === filter);
  const grouped = {};
  filtered.forEach(c => { if (!grouped[c.brand_key]) grouped[c.brand_key] = []; grouped[c.brand_key].push(c); });
  const S = {
    root: { fontFamily: "'DM Sans', sans-serif", background: "#0A0A0A", color: "#F0EDE6", minHeight: "100vh", padding: "40px 20px" },
    header: { textAlign: "center", marginBottom: 40 },
    title: { fontSize: 32, fontWeight: 800, letterSpacing: -1, background: "linear-gradient(135deg, #F0EDE6, #D4A853)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    sub: { fontSize: 14, color: "#888", marginTop: 8 },
    filters: { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 },
    chip: (a) => ({ padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", border: a ? "1px solid #D4A853" : "1px solid rgba(255,255,255,0.08)", background: a ? "rgba(212,168,83,0.15)" : "transparent", color: a ? "#D4A853" : "#666", fontFamily: "inherit" }),
    brandSection: { marginBottom: 32 },
    brandTitle: { fontSize: 13, letterSpacing: 3, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, paddingLeft: 4 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 },
    card: (color) => ({ display: "block", padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30`, textDecoration: "none", transition: "all 0.2s" }),
    cardTitle: { fontSize: 15, fontWeight: 700, color: "#F0EDE6", marginBottom: 4 },
    cardSub: (color) => ({ fontSize: 11, color, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }),
  };
  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.title}>KHG FORMS DIRECTORY</div>
        <div style={S.sub}>Applications, signups & onboarding across all KHG brands</div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{configs.length} forms across {brands.length} brands</div>
      </div>
      <div style={S.filters}>
        <button style={S.chip(filter === "all")} onClick={() => setFilter("all")}>All Brands</button>
        {brands.map(b => <button key={b} style={S.chip(filter === b)} onClick={() => setFilter(b)}>{b.replace(/_/g, " ")}</button>)}
      </div>
      {Object.entries(grouped).map(([brand, forms]) => (
        <div key={brand} style={S.brandSection}>
          <div style={{ ...S.brandTitle, color: forms[0]?.brand_color || "#D4A853" }}>
            {forms[0]?.logo_url && <img src={forms[0].logo_url} alt="" style={{ height: 28, objectFit: "contain", marginRight: 10, verticalAlign: "middle", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }} />}
            {brand.replace(/_/g, " ")}
          </div>
          <div style={S.grid}>
            {forms.map(f => (
              <a key={f.id} href={`/${f.brand_key.replace(/_/g, "-")}/${f.role_type}`} style={S.card(f.brand_color)}>
                <div style={S.cardTitle}>{f.form_title}</div>
                <div style={S.cardSub(f.brand_color)}>{f.role_type.replace(/_/g, " ")} {f.post_signup_enabled ? "• POST-SIGNUP FLOW" : ""}</div>
              </a>
            ))}
          </div>
        </div>
      ))}
      <div style={{ textAlign: "center", marginTop: 40, fontSize: 10, letterSpacing: 4, color: "#333", textTransform: "uppercase" }}>THE KOLLECTIVE HOSPITALITY GROUP</div>
    </div>
  );
}
