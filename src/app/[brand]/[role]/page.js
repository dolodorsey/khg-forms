"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const SB = "https://dzlmtvodpyhetvektfuo.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bG10dm9kcHloZXR2ZWt0ZnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODQ4NjQsImV4cCI6MjA4NTE2MDg2NH0.qmnWB4aWdb7U8Iod9Hv8PQAOJO3AG0vYEGnPS--kfAo";
const hdrs = { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json" };

const CITIES = ["Atlanta","Houston","DC","Los Angeles","Charlotte","Miami","New York","Dallas","Chicago","New Orleans","Las Vegas","Phoenix"];
const SIZES = ["XS","S","M","L","XL","2XL","3XL"];
const AGES = ["18-24","25-34","35-44","45-54","55+"];
const HEAR = ["Instagram","TikTok","Friend/Referral","Event","Website","Google","Twitter/X","Other"];

// Role-specific field configs
const ROLE_FIELDS = {
  dj: [
    {key:"genre_specialties",label:"GENRE SPECIALTIES",type:"multi",options:["Hip Hop","R&B","Afrobeats","House","Latin","Reggaeton","Pop","EDM","Open Format","Soca","Dancehall","Amapiano"]},
    {key:"years_experience",label:"YEARS OF EXPERIENCE",type:"select",options:["Under 1","1-3","3-5","5-10","10+"]},
    {key:"equipment",label:"EQUIPMENT YOU OWN",type:"multi",options:["Turntables","Controller","CDJs","Speakers","Lights","Microphone"]},
    {key:"mix_link",label:"MIX LINK (SOUNDCLOUD / MIXCLOUD)",type:"url"},
    {key:"rate_per_hour",label:"RATE PER HOUR ($)",type:"text"},
    {key:"available_days",label:"AVAILABLE DAYS",type:"multi",options:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]},
  ],
  influencer: [
    {key:"follower_count_ig",label:"INSTAGRAM FOLLOWERS",type:"select",options:["Under 5K","5K-10K","10K-25K","25K-50K","50K-100K","100K-500K","500K+"]},
    {key:"follower_count_tiktok",label:"TIKTOK FOLLOWERS",type:"select",options:["N/A","Under 5K","5K-10K","10K-25K","25K-50K","50K-100K","100K+"]},
    {key:"content_niche",label:"CONTENT NICHE",type:"multi",options:["Lifestyle","Nightlife","Food","Fashion","Fitness","Music","Comedy","Travel","Beauty","Culture"]},
    {key:"past_collabs",label:"PAST BRAND COLLABORATIONS",type:"textarea"},
    {key:"portfolio_url",label:"PORTFOLIO / MEDIA KIT LINK",type:"url"},
    {key:"rate_per_post",label:"RATE PER POST ($)",type:"text"},
    {key:"willing_post_schedule",label:"WILLING TO FOLLOW POST SCHEDULE?",type:"select",options:["Yes","Negotiable","Need Details"]},
    {key:"willing_bio_link",label:"WILLING TO ADD LINK IN BIO?",type:"select",options:["Yes","Negotiable","No"]},
  ],
  volunteer: [
    {key:"availability",label:"AVAILABLE DAYS",type:"multi",options:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]},
    {key:"skills",label:"SKILLS",type:"multi",options:["Setup/Teardown","Door/Check-In","VIP Host","Bartender Assist","Photography","Social Media","Other"]},
    {key:"has_transportation",label:"DO YOU HAVE TRANSPORTATION?",type:"select",options:["Yes","No","Sometimes"]},
    {key:"emergency_contact",label:"EMERGENCY CONTACT (NAME & PHONE)",type:"text"},
    {key:"dietary_restrictions",label:"DIETARY RESTRICTIONS",type:"text"},
    {key:"prior_experience",label:"PRIOR VOLUNTEER EXPERIENCE",type:"textarea"},
  ],
  vendor: [
    {key:"business_name",label:"BUSINESS / BRAND NAME",type:"text",required:true},
    {key:"vendor_type",label:"VENDOR TYPE",type:"select",options:["Food","Beverage","Merchandise","Art","Services","Sneakers/Streetwear","Jewelry","Other"]},
    {key:"product_description",label:"DESCRIBE YOUR PRODUCTS",type:"textarea"},
    {key:"health_permit",label:"HEALTH PERMIT (FOOD VENDORS)",type:"select",options:["Yes","N/A","In Process"]},
    {key:"booth_size",label:"BOOTH SIZE NEEDED",type:"select",options:["10x10","10x20","Custom"]},
    {key:"electricity_needed",label:"NEED ELECTRICITY?",type:"select",options:["Yes","No"]},
    {key:"sample_images",label:"PRODUCT IMAGES LINK",type:"url"},
  ],
  model: [
    {key:"height",label:"HEIGHT",type:"text"},
    {key:"hair_color",label:"HAIR COLOR",type:"text"},
    {key:"portfolio_url",label:"PORTFOLIO / COMP CARD LINK",type:"url"},
    {key:"agency",label:"AGENCY (IF ANY)",type:"text"},
    {key:"experience_types",label:"EXPERIENCE",type:"multi",options:["Runway","Print","Brand Hosting","Social Content","Video","Event Hosting","None Yet"]},
    {key:"rate_per_hour",label:"RATE PER HOUR ($)",type:"text"},
  ],
  artist: [
    {key:"art_type",label:"ART TYPE",type:"multi",options:["Painting","Sculpture","Digital","Mixed Media","Live Art","Murals","Photography","Other"]},
    {key:"portfolio_url",label:"PORTFOLIO LINK",type:"url",required:true},
    {key:"live_art_experience",label:"LIVE ART EXPERIENCE?",type:"select",options:["Yes","No","Willing To Try"]},
    {key:"setup_needs",label:"SETUP REQUIREMENTS",type:"textarea"},
  ],
  blogger: [
    {key:"outlet_name",label:"OUTLET / BLOG NAME",type:"text",required:true},
    {key:"outlet_url",label:"OUTLET URL",type:"url"},
    {key:"audience_size",label:"AUDIENCE SIZE",type:"select",options:["Under 5K","5K-25K","25K-100K","100K+"]},
    {key:"coverage_type",label:"COVERAGE TYPE",type:"multi",options:["Article","Photo Story","Video","Interview","Social Feature","Podcast"]},
    {key:"published_work",label:"LINK TO PUBLISHED WORK",type:"url"},
    {key:"equipment",label:"EQUIPMENT",type:"multi",options:["DSLR Camera","Mirrorless","Phone","Drone","Lighting","Audio"]},
  ],
  sponsor: [
    {key:"company_name",label:"COMPANY / BRAND NAME",type:"text",required:true},
    {key:"industry",label:"INDUSTRY",type:"text"},
    {key:"budget_range",label:"SPONSORSHIP BUDGET",type:"select",options:["Under $1K","$1K-$5K","$5K-$15K","$15K-$50K","$50K+","Open to Discussion"]},
    {key:"goals",label:"SPONSORSHIP GOALS",type:"multi",options:["Brand Awareness","Lead Generation","Product Sampling","VIP Access","Content Creation","Community Engagement"]},
    {key:"target_audience",label:"TARGET AUDIENCE",type:"textarea"},
    {key:"decision_timeline",label:"DECISION TIMELINE",type:"select",options:["ASAP","1-2 Weeks","1 Month","Flexible"]},
  ],
  promoter: [
    {key:"promotion_style",label:"PROMOTION STYLE",type:"multi",options:["Social Media","Word of Mouth","Flyers","Email Lists","Text Blasts","Influencer Network","Venue Connections"]},
    {key:"follower_count",label:"COMBINED SOCIAL FOLLOWING",type:"select",options:["Under 5K","5K-25K","25K-100K","100K+"]},
    {key:"past_events",label:"PAST EVENTS PROMOTED",type:"textarea"},
    {key:"cities_active",label:"CITIES ACTIVE IN",type:"multi",options:["Atlanta","Houston","DC","LA","Charlotte","Miami","New York","Dallas","Chicago"]},
    {key:"rate_expectation",label:"RATE / COMMISSION EXPECTATION",type:"text"},
  ],
  photographer: [
    {key:"specialty",label:"SPECIALTY",type:"multi",options:["Event","Portrait","Product","Video","Drone","Lifestyle","Fashion"]},
    {key:"equipment_list",label:"EQUIPMENT",type:"textarea"},
    {key:"portfolio_url",label:"PORTFOLIO LINK",type:"url",required:true},
    {key:"turnaround",label:"DELIVERY TURNAROUND",type:"select",options:["Same Day","24 Hours","48 Hours","1 Week"]},
    {key:"rate_per_event",label:"RATE PER EVENT ($)",type:"text"},
    {key:"editing_included",label:"EDITING INCLUDED?",type:"select",options:["Yes","Basic Only","No"]},
  ],
  ambassador: [
    {key:"follower_count_ig",label:"INSTAGRAM FOLLOWERS",type:"select",options:["Under 1K","1K-5K","5K-10K","10K-25K","25K-100K","100K+"]},
    {key:"content_style",label:"CONTENT STYLE",type:"multi",options:["Fashion","Lifestyle","Luxury","Streetwear","Fitness","Travel","Nightlife","Food"]},
    {key:"past_ambassador",label:"PAST AMBASSADOR PROGRAMS",type:"textarea"},
    {key:"why_join",label:"WHY DO YOU WANT TO BE AN AMBASSADOR?",type:"textarea"},
    {key:"preferred_payment",label:"PREFERRED PAYMENT METHOD",type:"select",options:["Direct Bank Transfer","PayPal","CashApp","Zelle","Store Credit"]},
  ],
  intern: [
    {key:"school_name",label:"SCHOOL / UNIVERSITY",type:"text",required:true},
    {key:"major",label:"MAJOR",type:"text"},
    {key:"graduation_year",label:"GRADUATION YEAR",type:"select",options:["2025","2026","2027","2028","2029"]},
    {key:"department_interest",label:"DEPARTMENT INTEREST",type:"multi",options:["Events","Marketing","Social Media","Operations","Design","Technology","F&B","Creative"]},
    {key:"hours_per_week",label:"AVAILABLE HOURS PER WEEK",type:"select",options:["10-15","15-20","20-30","30-40","Flexible"]},
    {key:"has_laptop",label:"DO YOU HAVE YOUR OWN LAPTOP?",type:"select",options:["Yes","No"]},
    {key:"why_khg",label:"WHY THE KOLLECTIVE?",type:"textarea"},
    {key:"resume_url",label:"RESUME LINK",type:"url"},
  ],
  applicant: [
    {key:"position",label:"POSITION APPLYING FOR",type:"text",required:true},
    {key:"department",label:"DEPARTMENT",type:"select",options:["Events","F&B","Marketing","Operations","Technology","Creative","Management","Legal","Finance"]},
    {key:"experience_years",label:"YEARS OF EXPERIENCE",type:"select",options:["Entry Level","1-3","3-5","5-10","10+"]},
    {key:"resume_url",label:"RESUME LINK",type:"url",required:true},
    {key:"cover_letter",label:"COVER LETTER / WHY US",type:"textarea"},
    {key:"salary_expectation",label:"SALARY EXPECTATION",type:"text"},
    {key:"start_date",label:"AVAILABLE START DATE",type:"text"},
  ],
  nda: [
    {key:"company_name",label:"COMPANY / ORGANIZATION NAME",type:"text"},
    {key:"title",label:"YOUR TITLE / POSITION",type:"text"},
    {key:"address",label:"MAILING ADDRESS",type:"textarea"},
    {key:"purpose",label:"PURPOSE OF NDA",type:"textarea",required:true},
    {key:"relationship_type",label:"RELATIONSHIP TYPE",type:"select",options:["Vendor","Contractor","Partner","Employee","Intern","Consultant","Investor","Other"]},
    {key:"duration",label:"CONFIDENTIALITY PERIOD",type:"select",options:["1 Year","2 Years","3 Years","5 Years","Indefinite"]},
    {key:"signature",label:"TYPE FULL LEGAL NAME AS SIGNATURE",type:"text",required:true},
    {key:"date_signed",label:"DATE",type:"text",required:true},
  ],
};

export default function FormPage() {
  const params = useParams();
  const brandSlug = params.brand;
  const roleType = params.role;
  const brandKey = brandSlug?.replace(/-/g, "_");

  const [config, setConfig] = useState(null);
  const [postSignup, setPostSignup] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0); // 0=post-signup step tracker
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    first_name:"",last_name:"",email:"",phone:"",city:"",
    instagram_handle:"",tiktok_handle:"",website_url:"",
    how_did_you_hear:"",age_range:"",
    shirt_size:"",pants_size:"",shoe_size:"",preferred_style:"",
    shipping_address:{line1:"",line2:"",city:"",state:"",zip:""},
    role_data:{}
  });

  useEffect(() => {
    (async () => {
      const [cfgRes, psRes] = await Promise.all([
        fetch(`${SB}/rest/v1/khg_form_configs?brand_key=eq.${brandKey}&role_type=eq.${roleType}&is_active=eq.true&limit=1`, { headers: hdrs }),
        fetch(`${SB}/rest/v1/khg_post_signup_flows?brand_key=eq.${brandKey}&role_type=eq.${roleType}&order=step_order.asc`, { headers: hdrs }),
      ]);
      const [cfg] = await cfgRes.json();
      const ps = await psRes.json();
      setConfig(cfg || null);
      setPostSignup(ps || []);
      setLoading(false);
    })();
  }, [brandKey, roleType]);

  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const uRole = (k, v) => setForm(p => ({ ...p, role_data: { ...p.role_data, [k]: v } }));
  const toggleRole = (k, v) => {
    const cur = form.role_data[k] || [];
    uRole(k, cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
  };
  const uShip = (k, v) => setForm(p => ({ ...p, shipping_address: { ...p.shipping_address, [k]: v } }));

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Required";
    if (!form.last_name.trim()) e.last_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.city) e.city = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        brand_key: brandKey,
        role_type: roleType,
        ...form,
        role_data: JSON.stringify(form.role_data),
        shipping_address: config?.include_shipping ? JSON.stringify(form.shipping_address) : null,
        shirt_size: config?.include_clothing ? form.shirt_size : null,
        pants_size: config?.include_clothing ? form.pants_size : null,
        shoe_size: config?.include_clothing ? form.shoe_size : null,
      };
      Object.keys(payload).forEach(k => { if (payload[k] === "") payload[k] = null; });
      payload.brand_key = brandKey;
      payload.role_type = roleType;
      payload.first_name = form.first_name;
      payload.last_name = form.last_name;
      payload.email = form.email;

      const res = await fetch(`${SB}/rest/v1/khg_universal_submissions`, {
        method: "POST", headers: { ...hdrs, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch (err) {
      alert("Error: " + err.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4A853", fontFamily: "'DM Sans',sans-serif", fontSize: 14, letterSpacing: 3 }}>LOADING...</div>;
  if (!config) return <div style={{ minHeight: "100vh", background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "center", color: "#E74C3C", fontFamily: "'DM Sans',sans-serif", fontSize: 16, flexDirection: "column", gap: 12 }}><div>FORM NOT FOUND</div><a href="/" style={{ color: "#D4A853", fontSize: 13 }}>← Back to Directory</a></div>;

  const C = config.brand_color || "#D4A853";
  const roleFields = ROLE_FIELDS[roleType] || [];

  const S = {
    root: { fontFamily: "'DM Sans',sans-serif", background: "#FAFAF8", color: "#1A1A1A", minHeight: "100vh" },
    container: { maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" },
    header: { textAlign: "center", marginBottom: 36, paddingTop: 12 },
    card: { background: "#FFFFFF", border: "1px solid #E8E4DE", borderRadius: 16, padding: "28px 24px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
    label: { display: "block", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#999", marginBottom: 6, fontWeight: 700 },
    input: { width: "100%", padding: "13px 14px", background: "#FAFAF8", border: "1px solid #E0DCD5", borderRadius: 10, color: "#1A1A1A", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s" },
    select: { width: "100%", padding: "13px 14px", background: "#FAFAF8", border: "1px solid #E0DCD5", borderRadius: 10, color: "#1A1A1A", fontSize: 14, outline: "none", fontFamily: "inherit", appearance: "none", cursor: "pointer", boxSizing: "border-box" },
    textarea: { width: "100%", padding: "13px 14px", background: "#FAFAF8", border: "1px solid #E0DCD5", borderRadius: 10, color: "#1A1A1A", fontSize: 14, outline: "none", fontFamily: "inherit", minHeight: 80, resize: "vertical", boxSizing: "border-box" },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    field: { marginBottom: 16 },
    chip: (a) => ({ display: "inline-block", padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", margin: "0 6px 8px 0", background: a ? `${C}18` : "#F5F3EF", border: a ? `2px solid ${C}` : "1px solid #E0DCD5", color: a ? C : "#888", transition: "all 0.2s", userSelect: "none" }),
    btn: { width: "100%", padding: "16px", background: C, border: "none", borderRadius: 12, color: "#FFFFFF", fontSize: 14, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 16px ${C}40` },
    err: { fontSize: 10, color: "#E74C3C", marginTop: 3 },
    sectionTitle: { fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C, marginBottom: 16, fontWeight: 700 },
    logoWrap: { display: "inline-block", padding: 16, borderRadius: 16, background: "#111", marginBottom: 16 },
  };

  const Field = ({ label, name, type="text", required, options, isRole }) => {
    const val = isRole ? (form.role_data[name] || "") : (form[name] || "");
    const set = isRole ? (v) => uRole(name, v) : (v) => u(name, v);
    if (type === "multi") {
      const selected = isRole ? (form.role_data[name] || []) : [];
      return (<div style={S.field}><label style={S.label}>{label}</label><div>{(options||[]).map(o => <span key={o} style={S.chip(selected.includes(o))} onClick={() => toggleRole(name, o)}>{o}</span>)}</div></div>);
    }
    if (type === "select") return (<div style={S.field}><label style={S.label}>{label}{required && <span style={{color:C}}> *</span>}</label><select value={val} onChange={e => set(e.target.value)} style={S.select}><option value="">Select...</option>{(options||[]).map(o => <option key={o} value={o}>{o}</option>)}</select></div>);
    if (type === "textarea") return (<div style={S.field}><label style={S.label}>{label}</label><textarea value={val} onChange={e => set(e.target.value)} style={S.textarea} /></div>);
    return (<div style={S.field}><label style={S.label}>{label}{required && <span style={{color:C}}> *</span>}</label><input type={type==="url"?"url":"text"} value={val} onChange={e => set(e.target.value)} style={{...S.input, ...(errors[name]?{borderColor:"#E74C3C"}:{})}} />{errors[name] && <div style={S.err}>{errors[name]}</div>}</div>);
  };

  // POST-SIGNUP VIEW
  if (submitted && postSignup.length > 0) {
    const ps = postSignup[step] || postSignup[postSignup.length - 1];
    const isLast = step >= postSignup.length - 1;
    return (
      <div style={S.root}>
        <div style={S.container}>
          <div style={S.header}>
            {config.logo_url && <div style={S.logoWrap}><img src={config.logo_url} alt="" style={{ height: 50, objectFit: "contain", display: "block" }} /></div>}
          </div>
          <div style={{ ...S.card, border: `2px solid ${C}30` }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C, fontWeight: 700, marginBottom: 8 }}>STEP {step + 1} OF {postSignup.length}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: "#1A1A1A" }}>{ps.instruction_title}</div>
            <div style={{ fontSize: 14, color: "#555", lineHeight: 1.8, whiteSpace: "pre-line" }}>{ps.instruction_body?.replace(/\*\*(.*?)\*\*/g, "$1")}</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ ...S.btn, background: "#FFF", border: `1px solid ${C}`, color: C, boxShadow: "none", flex: "0 0 auto", width: "auto", padding: "14px 24px" }}>← BACK</button>}
            <button onClick={() => isLast ? (window.location.href = "/") : setStep(s => s + 1)} style={{ ...S.btn, flex: 1 }}>
              {isLast ? "DONE — RETURN HOME" : `NEXT → STEP ${step + 2}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SIMPLE SUCCESS (no post-signup)
  if (submitted) return (
    <div style={S.root}>
      <div style={{ ...S.container, textAlign: "center", paddingTop: 80 }}>
        {config.logo_url && <div style={{...S.logoWrap, margin: "0 auto 20px"}}><img src={config.logo_url} alt="" style={{ height: 50, objectFit: "contain", display: "block" }} /></div>}
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: "#1A1A1A" }}>APPLICATION RECEIVED</div>
        <div style={{ fontSize: 15, color: "#666", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
          Thank you, <strong style={{color:"#1A1A1A"}}>{form.first_name}</strong>. We've received your <strong style={{color:C}}>{roleType.replace(/_/g," ")}</strong> application. Our team will review and follow up.
        </div>
        <a href="/" style={{ display: "inline-block", marginTop: 32, color: C, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>← BACK TO DIRECTORY</a>
      </div>
    </div>
  );

  // MAIN FORM
  return (
    <div style={S.root}>
      <div style={S.container}>
        {/* HEADER */}
        <div style={S.header}>
          {config.logo_url && <div style={S.logoWrap}><img src={config.logo_url} alt="" style={{ height: 56, objectFit: "contain", display: "block" }} /></div>}
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>{config.form_title}</div>
          {config.form_subtitle && <div style={{ fontSize: 13, color: "#888" }}>{config.form_subtitle}</div>}
        </div>

        {/* PERSONAL INFO */}
        <div style={S.card}>
          <div style={S.sectionTitle}>PERSONAL INFORMATION</div>
          <div style={S.row}>
            <Field label="First Name" name="first_name" required />
            <Field label="Last Name" name="last_name" required />
          </div>
          <div style={S.row}>
            <Field label="Email" name="email" type="email" required />
            <Field label="Phone" name="phone" required />
          </div>
          <div style={S.row}>
            <Field label="City" name="city" required options={CITIES} type="select" />
            <Field label="Age Range" name="age_range" options={AGES} type="select" />
          </div>
          <div style={S.row}>
            <Field label="Instagram" name="instagram_handle" />
            <Field label="TikTok" name="tiktok_handle" />
          </div>
          <Field label="Website" name="website_url" type="url" />
          <Field label="How Did You Hear About Us?" name="how_did_you_hear" options={HEAR} type="select" />
        </div>

        {/* ROLE-SPECIFIC FIELDS */}
        {roleFields.length > 0 && (
          <div style={S.card}>
            <div style={S.sectionTitle}>{roleType.replace(/_/g," ").toUpperCase()} DETAILS</div>
            {roleFields.map(f => <Field key={f.key} label={f.label} name={f.key} type={f.type} options={f.options} required={f.required} isRole />)}
          </div>
        )}

        {/* CLOTHING / MERCH */}
        {config.include_clothing && (
          <div style={S.card}>
            <div style={S.sectionTitle}>CLOTHING & MERCH SIZE</div>
            <div style={S.row}>
              <Field label="Shirt Size" name="shirt_size" options={SIZES} type="select" />
              <Field label="Shoe Size" name="shoe_size" />
            </div>
            <Field label="Pants Size (Waist)" name="pants_size" />
            <Field label="Preferred Style" name="preferred_style" options={["Streetwear","Casual","Formal","Athletic","Luxury"]} type="select" />
          </div>
        )}

        {/* SHIPPING */}
        {config.include_shipping && (
          <div style={S.card}>
            <div style={S.sectionTitle}>SHIPPING ADDRESS</div>
            <Field label="Address Line 1" name="line1" isRole={false} />
            <div style={S.field}><label style={S.label}>ADDRESS LINE 1</label><input value={form.shipping_address.line1} onChange={e=>uShip("line1",e.target.value)} style={S.input} /></div>
            <div style={S.field}><label style={S.label}>ADDRESS LINE 2</label><input value={form.shipping_address.line2} onChange={e=>uShip("line2",e.target.value)} style={S.input} /></div>
            <div style={S.row}>
              <div style={S.field}><label style={S.label}>CITY</label><input value={form.shipping_address.city} onChange={e=>uShip("city",e.target.value)} style={S.input} /></div>
              <div style={S.field}><label style={S.label}>STATE</label><input value={form.shipping_address.state} onChange={e=>uShip("state",e.target.value)} style={S.input} /></div>
            </div>
            <div style={S.field}><label style={S.label}>ZIP CODE</label><input value={form.shipping_address.zip} onChange={e=>uShip("zip",e.target.value)} style={S.input} /></div>
          </div>
        )}

        {/* SUBMIT */}
        <button onClick={handleSubmit} disabled={submitting} style={{ ...S.btn, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
        </button>

        {/* FOOTER */}
        <div style={{ textAlign: "center", marginTop: 32, fontSize: 9, letterSpacing: 3, color: "#333", textTransform: "uppercase" }}>
          THE KOLLECTIVE HOSPITALITY GROUP
        </div>
      </div>
    </div>
  );
}
