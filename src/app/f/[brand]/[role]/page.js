"use client";

import { cloneElement, isValidElement, useEffect, useId, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

const ENDPOINT = "https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-form-intake";
const CITIES = ["Atlanta", "Houston", "Washington, DC", "Los Angeles", "Charlotte", "Miami", "New York", "Dallas", "Chicago", "New Orleans", "Las Vegas", "Phoenix", "Other"];
const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const REQUIRED_MESSAGE = "Please complete the required fields.";
const PILL_MAX_OPTIONS = 6;

const normalize = (value = "") => decodeURIComponent(value).replace(/-/g, "_").toLowerCase();
const pretty = (value = "") => value.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

// ---------- copy helpers ----------
const KEEP_UPPER = new Set(["DJ", "VIP", "NYC", "ATL", "LA", "DC", "USA", "US", "KHG", "MC", "CEO", "PR", "UGC", "RSVP", "FAQ", "HBCU", "NBA", "NFL", "WNBA", "ATF", "OG", "XXX", "SOS", "II", "III", "IV", "TV", "LLC", "NIL", "AAU", "B2B", "RTD", "ID", "NOC"]);
const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "with"]);

// Only rewrites text that arrives fully upper-case; mixed-case copy is left as authored.
function smartCase(text = "") {
  if (!text || /[a-z]/.test(text)) return text;
  let index = 0;
  return text.split(/(\s+)/).map((token) => {
    if (/^\s+$/.test(token)) return token;
    const bare = token.replace(/[^A-Z0-9&]/g, "");
    const position = index++;
    if (KEEP_UPPER.has(bare)) return token;
    const lower = token.toLowerCase();
    if (position > 0 && SMALL_WORDS.has(lower)) return lower;
    return lower.replace(/(^|[-/(])([a-z])/g, (_, p, c) => p + c.toUpperCase());
  }).join("");
}

function parseTitle(config) {
  const raw = String(config.form_title || pretty(config.role_type || "")).trim();
  let brand = "";
  let rest = raw;
  const dash = raw.split(/\s+[—–]\s+/);
  if (dash.length > 1) { brand = dash[0]; rest = dash.slice(1).join(" — "); }
  const dot = rest.split(/\s+·\s+/);
  const title = dot[0];
  const meta = dot.slice(1).join(" · ");
  return {
    brand: smartCase(brand) || pretty(config.brand_key || ""),
    title: smartCase(title),
    meta: smartCase(meta),
  };
}

function splitSubtitle(text = "") {
  const sentences = String(text).split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter(Boolean);
  return { lede: sentences[0] || "", notes: sentences.slice(1) };
}

function detailsTitle(config) {
  if (config.details_title) return config.details_title;
  const haystack = `${config.role_type} ${config.form_title}`.toLowerCase();
  if (haystack.includes("athlete") || haystack.includes("tryout")) return "Athlete profile";
  if (haystack.includes("coach")) return "Coaching background";
  if (haystack.includes("team")) return "Team details";
  if (haystack.includes("sponsor")) return "Sponsorship details";
  if (haystack.includes("vendor")) return "Vendor details";
  if (haystack.includes("venue")) return "Venue details";
  return "Details";
}

// ---------- color helpers ----------
function hexToRgb(hex = "") {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function brandTokens(color) {
  const brand = hexToRgb(color) || hexToRgb("#2B3A55");
  const white = [255, 255, 255];
  const black = [17, 19, 22];
  let ink = brand;
  for (let t = 0.08; contrast(ink, white) < 4.6 && t <= 1; t += 0.08) ink = mix(brand, black, t);
  const onBrand = contrast(brand, white) >= contrast(brand, black) ? "#FFFFFF" : "#111316";
  return {
    "--kf-brand": toHex(brand),
    "--kf-ink": toHex(ink),
    "--kf-on-brand": onBrand,
    "--kf-brand-deep": toHex(mix(brand, black, 0.35)),
    "--kf-tint": `rgba(${brand.join(",")}, 0.09)`,
    "--kf-ring": `rgba(${brand.join(",")}, 0.28)`,
  };
}

// ---------- page ----------
export default function UniversalFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const normalizedBrandKey = normalize(params?.brand);
  const rawBrandKey = searchParams?.get("brand_key") || "";
  // Optional exact-key alias for legacy records such as "good-times" vs "good_times".
  // Only allow aliases that normalize to this same URL brand to prevent cross-brand routing.
  const brandKey = /^[a-z0-9_-]{2,120}$/.test(rawBrandKey) &&
    rawBrandKey.replaceAll("-", "_") === normalizedBrandKey ? rawBrandKey : normalizedBrandKey;
  const roleType = normalize(params?.role);

  const [config, setConfig] = useState(null);
  const [postSignup, setPostSignup] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [files, setFiles] = useState({});
  const [smsConsent, setSmsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [acknowledgmentChecked, setAcknowledgmentChecked] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [signatureDrawn, setSignatureDrawn] = useState(false);
  const [showMoreLinks, setShowMoreLinks] = useState(false);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const hasSignatureRef = useRef(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    city: "",
    instagram_handle: "",
    tiktok_handle: "",
    website_url: "",
    how_did_you_hear: "",
    age_range: "",
    shirt_size: "",
    pants_size: "",
    shoe_size: "",
    preferred_style: "",
    shipping_address: { line1: "", line2: "", city: "", state: "", zip: "" },
    role_data: {},
  });

  const utmParams = useMemo(() => {
    const out = {};
    if (!searchParams) return out;
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"].forEach((key) => {
      const value = searchParams.get(key);
      if (value) out[key] = value.slice(0, 500);
    });
    return out;
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${ENDPOINT}?brand_key=${encodeURIComponent(brandKey)}&role_type=${encodeURIComponent(roleType)}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "FORM_NOT_FOUND");
        if (!active) return;
        setConfig(data.config || null);
        setPostSignup(Array.isArray(data.post_signup) ? data.post_signup : []);
      } catch (e) {
        if (active) setError(humanError(e?.message));
      } finally {
        if (active) setLoading(false);
      }
    }
    if (brandKey && roleType) load();
    return () => { active = false; };
  }, [brandKey, roleType]);

  useEffect(() => {
    if (config?.form_title && typeof document !== "undefined") {
      const t = parseTitle(config);
      document.title = [t.title, t.brand].filter(Boolean).join(" — ");
    }
  }, [config]);

  // Once every flagged field is fixed, the "complete the required fields" banner has done its job.
  useEffect(() => {
    if (error === REQUIRED_MESSAGE && Object.keys(fieldErrors).length === 0) setError("");
  }, [fieldErrors, error]);

  const clearError = (...keys) => setFieldErrors((prev) => {
    if (!keys.some((k) => prev[k])) return prev;
    const next = { ...prev };
    keys.forEach((k) => delete next[k]);
    return next;
  });

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(key, key === "instagram_handle" ? "instagram" : key, key === "tiktok_handle" ? "tiktok" : key, key === "website_url" ? "website" : key);
  };
  const updateRole = (key, value) => {
    setForm((prev) => ({ ...prev, role_data: { ...prev.role_data, [key]: value } }));
    clearError(key);
  };
  const updateShipping = (key, value) => setForm((prev) => ({ ...prev, shipping_address: { ...prev.shipping_address, [key]: value } }));

  function toggleMulti(key, option) {
    const current = Array.isArray(form.role_data[key]) ? form.role_data[key] : [];
    updateRole(key, current.includes(option) ? current.filter((v) => v !== option) : [...current, option]);
  }

  function setupCanvas(canvas) {
    if (!canvas || canvas.dataset.ready) return;
    canvasRef.current = canvas;
    canvas.dataset.ready = "true";
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#15171A";

    const point = (event) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = event.touches?.[0]?.clientX ?? event.clientX;
      const clientY = event.touches?.[0]?.clientY ?? event.clientY;
      return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
    };
    const start = (event) => {
      event.preventDefault();
      drawingRef.current = true;
      const p = point(event);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const move = (event) => {
      if (!drawingRef.current) return;
      event.preventDefault();
      const p = point(event);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      if (!hasSignatureRef.current) {
        hasSignatureRef.current = true;
        setSignatureDrawn(true);
        clearError("signature");
      }
    };
    const stop = () => { drawingRef.current = false; };
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", stop, { passive: true });
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    hasSignatureRef.current = false;
    setSignatureDrawn(false);
  }

  function validate() {
    const errors = {};
    const aliases = { instagram: "instagram_handle", tiktok: "tiktok_handle", website: "website_url" };
    const required = config?.required_fields || [];
    required.forEach((field) => {
      const key = aliases[field] || field;
      const value = form[key] ?? form.role_data[field];
      if (value == null || value === "" || (Array.isArray(value) && !value.length)) errors[field] = "Required";
    });
    (config?.custom_fields || []).forEach((field) => {
      if (!field?.required) return;
      if (field.type === "file") {
        if (!files[field.key] && !form.role_data[field.key]) errors[field.key] = "Required";
        return;
      }
      const value = form.role_data[field.key];
      if (field.type === "checkbox") {
        if (value !== true) errors[field.key] = "Required";
      } else if (value == null || value === "" || (Array.isArray(value) && !value.length)) {
        errors[field.key] = "Required";
      }
    });
    if (form.email.trim() && !/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
    if (form.phone.trim() && form.phone.replace(/[^0-9]/g, "").length < 10) errors.phone = "Enter a 10-digit phone number.";
    if (form.website_url.trim()) {
      try { const url = new URL(form.website_url); if (!["http:", "https:"].includes(url.protocol)) errors.website_url = "Enter a valid website URL."; }
      catch { errors.website_url = "Enter a full website URL, starting with https://"; }
    }
    if (config?.requires_acknowledgment && !acknowledgmentChecked) errors.acknowledgment = "Accept the agreement to continue.";
    if (config?.requires_signature_canvas && !hasSignatureRef.current) errors.signature = "Draw your signature in the box.";
    if (errors.tiktok || errors.website || errors.website_url) setShowMoreLinks(true);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function focusFirstInvalid() {
    window.setTimeout(() => {
      const el = document.querySelector('[data-khg-form] [data-invalid="true"]');
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.querySelector("input:not([type=hidden]), select, textarea, button")?.focus({ preventScroll: true });
    }, 30);
  }

  async function uploadFiles() {
    const uploadedPaths = [];
    const uploadedRoleData = {};
    const entries = Object.entries(files).filter(([, file]) => file instanceof File);
    const max = Math.max(Number(config?.max_upload_files || 5), 1);
    if (entries.length > max) throw new Error(`MAX_${max}_FILES`);

    for (const [fieldKey, file] of entries) {
      const fd = new FormData();
      fd.append("brand_key", brandKey);
      fd.append("role_type", roleType);
      fd.append("field_key", fieldKey);
      fd.append("file", file);
      const res = await fetch(`${ENDPOINT}?action=upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "UPLOAD_FAILED");
      if (data?.file?.path) {
        uploadedPaths.push(data.file.path);
        uploadedRoleData[fieldKey] = data.file.path;
      }
    }
    return { uploadedPaths, uploadedRoleData };
  }

  async function handleSubmit(event) {
    event?.preventDefault?.();
    if (!validate()) {
      setError(REQUIRED_MESSAGE);
      focusFirstInvalid();
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { uploadedPaths, uploadedRoleData } = config?.allow_file_uploads ? await uploadFiles() : { uploadedPaths: [], uploadedRoleData: {} };
      const signature = config?.requires_signature_canvas && canvasRef.current && hasSignatureRef.current
        ? canvasRef.current.toDataURL("image/png")
        : null;
      const payload = {
        ...form,
        brand_key: brandKey,
        role_type: roleType,
        app_key: config?.app_key || null,
        role_data: { ...form.role_data, ...uploadedRoleData },
        uploaded_files: uploadedPaths,
        acknowledgment_accepted: acknowledgmentChecked,
        signature_drawn_data_url: signature,
        signature_typed: form.role_data?.signature || null,
        legal_document_version: config?.legal_document_title ? `v1_${String(config.legal_document_title).replace(/\s+/g, "_").toLowerCase()}` : null,
        signed_at: signature || acknowledgmentChecked ? new Date().toISOString() : null,
        scrolled_to_bottom: scrolledToBottom,
        source_url: typeof window !== "undefined" ? window.location.href : null,
        utm_params: utmParams,
        sms_consent: smsConsent,
        marketing_consent: marketingConsent,
        email_consent: marketingConsent,
        _company_website: honeypot,
        metadata: { renderer: "khg-forms-v3", route: `/f/${brandKey}/${roleType}` },
      };
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data?.ok !== true || !data?.submission?.submission_ref) {
        throw new Error(data?.error || "SUBMISSION_NOT_CONFIRMED");
      }
      setSubmitted(data.submission);
      setStep(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(humanError(e?.message));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingShell />;
  if (!config) return (
    <Shell tokens={brandTokens("#2B3A55")}>
      <Band brand="The Kollective Hospitality Group" title="This form isn't available" lede={error || "The link may be out of date. Check with the person who sent it."} />
    </Shell>
  );

  const tokens = brandTokens(config.brand_color || "#B68A42");
  const heading = parseTitle(config);
  const { lede, notes } = splitSubtitle(config.form_subtitle);
  const customFields = Array.isArray(config.custom_fields) ? config.custom_fields : [];
  const requiredCore = new Set(["first_name", "last_name", "email", ...(config.required_fields || [])]);
  const isReq = (...keys) => keys.some((k) => requiredCore.has(k));

  if (submitted && postSignup.length > 0) {
    const current = postSignup[Math.min(step, postSignup.length - 1)];
    const last = step >= postSignup.length - 1;
    return (
      <Shell tokens={tokens}>
        <Band brand={heading.brand} title={heading.title} meta={heading.meta} compact />
        <div className="kf-sheet kf-sheet--narrow">
          <div className="kf-steps-count">Next step {step + 1} of {postSignup.length}</div>
          <h2 className="kf-step-title">{current?.instruction_title || "Next step"}</h2>
          <div className="kf-prose">{current?.instruction_body}</div>
          {current?.action_url && <a href={current.action_url} target="_blank" rel="noreferrer" className="kf-link-button">Open this step</a>}
          <button className="kf-submit" onClick={() => last ? window.location.assign("/") : setStep((s) => s + 1)}>
            {last ? "Done" : "Continue"}
          </button>
        </div>
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell tokens={tokens}>
        <Band brand={heading.brand} title={heading.title} meta={heading.meta} compact />
        <div className="kf-sheet kf-sheet--narrow kf-success">
          <svg className="kf-success-mark" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" />
            <path d="M15 27l7 7 15-16" />
          </svg>
          <h1 className="kf-success-title">{smartCase(config.success_title || "Submission received")}</h1>
          <p className="kf-prose">{config.success_body || "Your submission has been received. Our team will follow up."}</p>
          {submitted?.submission_ref && (
            <div className="kf-reference">
              <span>Reference</span>
              <strong>{submitted.submission_ref}</strong>
            </div>
          )}
        </div>
      </Shell>
    );
  }

  // ----- progress model -----
  const filled = (v) => !(v == null || v === "" || v === false || (Array.isArray(v) && !v.length));
  const coreValue = (k) => form[{ instagram: "instagram_handle", tiktok: "tiktok_handle", website: "website_url" }[k] || k] ?? form.role_data[k];
  const sections = [];
  sections.push({ id: "kf-contact", title: "Contact", req: [...requiredCore].map((k) => filled(coreValue(k))) });
  if (customFields.length) sections.push({
    id: "kf-details", title: detailsTitle(config),
    req: customFields.filter((f) => f.required).map((f) => f.type === "file" ? Boolean(files[f.key] || form.role_data[f.key]) : f.type === "checkbox" ? form.role_data[f.key] === true : filled(form.role_data[f.key])),
  });
  if (config.legal_document_text) sections.push({
    id: "kf-agreement", title: smartCase(config.legal_document_title || "Agreement"),
    req: [config.requires_acknowledgment ? acknowledgmentChecked : null, config.requires_signature_canvas ? signatureDrawn : null].filter((x) => x !== null),
  });
  if (config.include_clothing) sections.push({ id: "kf-sizing", title: "Sizing", req: [] });
  if (config.include_shipping) sections.push({ id: "kf-shipping", title: "Shipping", req: [] });
  sections.push({ id: "kf-updates", title: "Updates", req: [] });
  const totalReq = sections.reduce((n, s) => n + s.req.length, 0);
  const doneReq = sections.reduce((n, s) => n + s.req.filter(Boolean).length, 0);
  const pct = totalReq ? Math.round((doneReq / totalReq) * 100) : 100;
  const sectionNo = (id) => sections.findIndex((s) => s.id === id) + 1;

  return (
    <Shell tokens={tokens}>
      <Band brand={heading.brand} title={heading.title} meta={heading.meta} lede={lede} notes={notes} />

      <div className="kf-sheet">
        <aside className="kf-rail" aria-label="Form progress">
          <div className="kf-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Required answers completed">
            <div className="kf-progress-text">
              <strong>{doneReq}</strong> of {totalReq} required
            </div>
            <div className="kf-progress-track"><div className="kf-progress-fill" style={{ width: `${pct}%` }} /></div>
          </div>
          <ol className="kf-rail-list">
            {sections.map((s, i) => {
              const state = !s.req.length ? "optional" : s.req.every(Boolean) ? "done" : "todo";
              return (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="kf-rail-link" data-state={state}>
                    <span className="kf-rail-num">{state === "done" ? "✓" : i + 1}</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </aside>

        <form onSubmit={handleSubmit} noValidate className="kf-form">
          <Section id="kf-contact" n={sectionNo("kf-contact")} title="Contact" hint="Where we'll reach you about this.">
            <div className="kf-grid">
              <CoreInput label="First name" name="first_name" autoComplete="given-name" value={form.first_name} onChange={update} required error={fieldErrors.first_name} />
              <CoreInput label="Last name" name="last_name" autoComplete="family-name" value={form.last_name} onChange={update} required error={fieldErrors.last_name} />
              <CoreInput label="Email" name="email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={update} required error={fieldErrors.email} />
              <CoreInput label="Phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="(404) 555-0123" value={form.phone} onChange={update} required={isReq("phone")} error={fieldErrors.phone} />
              <CoreSelect label="City / market" name="city" value={form.city} onChange={update} options={CITIES} required={isReq("city")} error={fieldErrors.city} />
              <CoreInput label="Instagram" name="instagram_handle" placeholder="@handle" autoComplete="off" value={form.instagram_handle} onChange={update} required={isReq("instagram", "instagram_handle")} error={fieldErrors.instagram || fieldErrors.instagram_handle} />
            </div>
            {showMoreLinks || isReq("tiktok", "tiktok_handle", "website", "website_url") ? (
              <div className="kf-grid">
                <CoreInput label="TikTok" name="tiktok_handle" placeholder="@handle" autoComplete="off" value={form.tiktok_handle} onChange={update} required={isReq("tiktok", "tiktok_handle")} error={fieldErrors.tiktok || fieldErrors.tiktok_handle} />
                <CoreInput label="Website" name="website_url" type="url" inputMode="url" placeholder="https://" value={form.website_url} onChange={update} required={isReq("website", "website_url")} error={fieldErrors.website || fieldErrors.website_url} />
              </div>
            ) : (
              <button type="button" className="kf-reveal" onClick={() => setShowMoreLinks(true)}>
                + Add TikTok or a website
              </button>
            )}
          </Section>

          {customFields.length > 0 && (
            <Section id="kf-details" n={sectionNo("kf-details")} title={detailsTitle(config)}>
              <div className="kf-grid">
              {pairFields(customFields).map(({ field, wide }) => (
                <DynamicField
                  key={field.key}
                  wide={wide}
                  field={field}
                  value={form.role_data[field.key]}
                  file={files[field.key]}
                  onChange={(value) => updateRole(field.key, value)}
                  onToggle={(option) => toggleMulti(field.key, option)}
                  onFile={(file) => { setFiles((prev) => ({ ...prev, [field.key]: file })); clearError(field.key); }}
                  error={fieldErrors[field.key]}
                />
              ))}
              </div>
            </Section>
          )}

          {config.legal_document_text && (
            <Section id="kf-agreement" n={sectionNo("kf-agreement")} title={smartCase(config.legal_document_title || "Agreement")} hint="Scroll through the full text before you sign.">
              <div
                tabIndex={0}
                aria-label="Agreement text"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolledToBottom(true);
                }}
                className="kf-legal"
              >
                {config.legal_document_text}
              </div>
              {config.requires_acknowledgment && (
                <div className="kf-field" data-invalid={Boolean(fieldErrors.acknowledgment) || undefined}>
                  <label className="kf-check">
                    <input type="checkbox" checked={acknowledgmentChecked} onChange={(e) => { setAcknowledgmentChecked(e.target.checked); clearError("acknowledgment"); }} />
                    <span className="kf-check-box" aria-hidden="true" />
                    <span>I have read and agree to this agreement.</span>
                  </label>
                  {fieldErrors.acknowledgment && <div className="kf-error" role="alert">{fieldErrors.acknowledgment}</div>}
                </div>
              )}
              {config.requires_signature_canvas && (
                <div className="kf-field" data-invalid={Boolean(fieldErrors.signature) || undefined}>
                  <div className="kf-label">Signature<span className="kf-req" aria-hidden="true">*</span></div>
                  <div className="kf-sign">
                    <canvas ref={setupCanvas} width={900} height={220} className="kf-canvas" aria-label="Signature pad: draw with your finger or mouse" />
                    {!signatureDrawn && <span className="kf-sign-hint" aria-hidden="true">Sign here</span>}
                  </div>
                  <button type="button" onClick={clearSignature} className="kf-text-button">Clear signature</button>
                  {fieldErrors.signature && <div className="kf-error" role="alert">{fieldErrors.signature}</div>}
                </div>
              )}
            </Section>
          )}

          {config.include_clothing && (
            <Section id="kf-sizing" n={sectionNo("kf-sizing")} title="Sizing">
              <div className="kf-grid">
                <CoreSelect label="Shirt size" name="shirt_size" value={form.shirt_size} onChange={update} options={SIZES} />
                <CoreInput label="Shoe size" name="shoe_size" value={form.shoe_size} onChange={update} />
                <CoreInput label="Pants / waist size" name="pants_size" value={form.pants_size} onChange={update} />
                <CoreSelect label="Preferred style" name="preferred_style" value={form.preferred_style} onChange={update} options={["Streetwear", "Casual", "Formal", "Athletic", "Luxury"]} />
              </div>
            </Section>
          )}

          {config.include_shipping && (
            <Section id="kf-shipping" n={sectionNo("kf-shipping")} title="Shipping address">
              <ShippingField label="Address line 1" name="line1" autoComplete="address-line1" value={form.shipping_address.line1} onChange={updateShipping} />
              <ShippingField label="Address line 2" name="line2" autoComplete="address-line2" value={form.shipping_address.line2} onChange={updateShipping} />
              <div className="kf-grid kf-grid--3">
                <ShippingField label="City" name="city" autoComplete="address-level2" value={form.shipping_address.city} onChange={updateShipping} />
                <ShippingField label="State" name="state" autoComplete="address-level1" value={form.shipping_address.state} onChange={updateShipping} />
                <ShippingField label="ZIP code" name="zip" autoComplete="postal-code" inputMode="numeric" value={form.shipping_address.zip} onChange={updateShipping} />
              </div>
            </Section>
          )}

          <Section id="kf-updates" n={sectionNo("kf-updates")} title="Updates" hint="Optional. Choose how we keep you posted.">
            <label className="kf-check">
              <input type="checkbox" checked={smsConsent} onChange={(e) => setSmsConsent(e.target.checked)} />
              <span className="kf-check-box" aria-hidden="true" />
              <span>Text me updates about this submission. Message and data rates may apply.</span>
            </label>
            <label className="kf-check">
              <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} />
              <span className="kf-check-box" aria-hidden="true" />
              <span>Email me occasional brand news, opportunities and offers.</span>
            </label>
          </Section>

          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
            <label>Company Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
          </div>

          <div className="kf-finish">
            {error && (
              <div className="kf-banner" role="alert">
                {error}
                {error === REQUIRED_MESSAGE && Object.keys(fieldErrors).length > 0 && (
                  <span> {Object.keys(fieldErrors).length === 1 ? "One field is" : `${Object.keys(fieldErrors).length} fields are`} highlighted above.</span>
                )}
              </div>
            )}
            <button type="submit" disabled={submitting} className="kf-submit">
              {submitting ? "Sending…" : smartCase(config.submit_label || "Submit")}
            </button>
            <p className="kf-fineprint">Your answers go only to {heading.brand || "this brand"} for this {String(config.form_kind || "application").replace(/_/g, " ")}. We contact you based on the preferences above.</p>
          </div>
        </form>
      </div>
    </Shell>
  );
}

// ---------- fields ----------
// Short inputs sit two-up; a short input with no short neighbour takes the full row,
// so DOM order (and keyboard order) always matches visual order.
function isShortField(field) {
  const type = field.type || "text";
  const options = Array.isArray(field.options) ? field.options : [];
  const shortType = ["text", "number", "email", "tel", "date"].includes(type) || (type === "select" && options.length > PILL_MAX_OPTIONS);
  return shortType && String(field.label || "").length <= 46 && !field.help;
}
function pairFields(fields) {
  const out = fields.map((field) => ({ field, wide: true }));
  for (let i = 0; i < out.length - 1; i++) {
    if (isShortField(out[i].field) && isShortField(out[i + 1].field)) {
      out[i].wide = false;
      out[i + 1].wide = false;
      i++;
    }
  }
  return out;
}

function DynamicField(props) {
  return <div className={props.wide ? "kf-span" : undefined}><DynamicFieldInner {...props} /></div>;
}

function DynamicFieldInner({ field, value, file, onChange, onToggle, onFile, error }) {
  const required = Boolean(field.required);
  const type = field.type || "text";
  const options = Array.isArray(field.options) ? field.options : [];

  if (type === "textarea") return (
    <FieldWrap label={field.label} required={required} error={error} help={field.help}>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder || ""} className="kf-input kf-textarea" rows={4} />
    </FieldWrap>
  );

  if (type === "select" && options.length > 0 && options.length <= PILL_MAX_OPTIONS) return (
    <FieldWrap label={field.label} required={required} error={error} help={field.help} group>
      <div className="kf-pills" role="radiogroup" aria-label={field.label}>
        {options.map((option) => {
          const active = value === option;
          return (
            <button type="button" key={option} role="radio" aria-checked={active} className="kf-pill" data-active={active || undefined}
              onClick={() => onChange(active && !required ? "" : option)}>
              {option}
            </button>
          );
        })}
      </div>
    </FieldWrap>
  );

  if (type === "select") return (
    <FieldWrap label={field.label} required={required} error={error} help={field.help}>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="kf-input kf-select">
        <option value="">Choose one</option>
        {options.map((option) => <option value={option} key={option}>{option}</option>)}
      </select>
    </FieldWrap>
  );

  if (type === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <FieldWrap label={field.label} required={required} error={error} help={field.help || "Choose all that apply."} group>
        <div className="kf-pills">
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button type="button" key={option} aria-pressed={active} className="kf-pill kf-pill--multi" data-active={active || undefined} onClick={() => onToggle(option)}>
                <span className="kf-pill-tick" aria-hidden="true">{active ? "✓" : "+"}</span>{option}
              </button>
            );
          })}
        </div>
      </FieldWrap>
    );
  }

  if (type === "checkbox") return (
    <div className="kf-field" data-invalid={Boolean(error) || undefined}>
      <label className="kf-check kf-check--card">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} aria-invalid={Boolean(error)} />
        <span className="kf-check-box" aria-hidden="true" />
        <span>{field.label}{required && <span className="kf-req" aria-hidden="true">*</span>}</span>
      </label>
      {error && <div className="kf-error" role="alert">{error}</div>}
    </div>
  );

  if (type === "file") return (
    <FieldWrap label={field.label} required={required} error={error} help={field.help} group>
      <label className="kf-file" data-has-file={Boolean(file) || undefined}>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
          className="kf-file-input"
        />
        <span className="kf-file-main">{file ? `✓ ${file.name}` : "Choose a file"}</span>
        <span className="kf-file-sub">{file ? "Tap to replace" : "PDF, JPG, PNG, WebP or DOCX, up to 10 MB"}</span>
      </label>
    </FieldWrap>
  );

  const htmlType = ["email", "tel", "url", "number", "date"].includes(type) ? type : "text";
  const inputMode = { email: "email", tel: "tel", url: "url", number: "numeric" }[type];
  return (
    <FieldWrap label={field.label} required={required} error={error} help={field.help}>
      <input
        type={htmlType}
        inputMode={inputMode}
        min={htmlType === "number" ? 0 : undefined}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || (type === "url" ? "https://" : "")}
        className="kf-input"
      />
    </FieldWrap>
  );
}

function CoreInput({ label, name, value, onChange, type = "text", required, error, ...rest }) {
  return <FieldWrap label={label} required={required} error={error}><input type={type} value={value || ""} onChange={(e) => onChange(name, e.target.value)} className="kf-input" {...rest} /></FieldWrap>;
}
function CoreSelect({ label, name, value, onChange, options, required, error }) {
  return <FieldWrap label={label} required={required} error={error}><select value={value || ""} onChange={(e) => onChange(name, e.target.value)} className="kf-input kf-select"><option value="">Choose one</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></FieldWrap>;
}
function ShippingField({ label, name, value, onChange, ...rest }) {
  return <FieldWrap label={label}><input value={value || ""} onChange={(e) => onChange(name, e.target.value)} className="kf-input" {...rest} /></FieldWrap>;
}
function FieldWrap({ label, required, error, help, group, children }) {
  const id = useId();
  const nativeControl = !group && isValidElement(children) && typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  const describedBy = [help ? id + "-help" : null, error ? id + "-error" : null].filter(Boolean).join(" ") || undefined;
  const labelBody = <>{label}{required && <span className="kf-req" aria-hidden="true">*</span>}</>;
  return (
    <div className="kf-field" data-invalid={Boolean(error) || undefined} role={group ? "group" : undefined} aria-labelledby={group ? id + "-label" : undefined}>
      {nativeControl
        ? <label htmlFor={id} className="kf-label">{labelBody}</label>
        : <div id={id + "-label"} className="kf-label">{labelBody}</div>}
      {help && <div id={id + "-help"} className="kf-help">{help}</div>}
      {nativeControl
        ? cloneElement(children, { id, required: Boolean(required), "aria-required": Boolean(required) || undefined, "aria-invalid": Boolean(error), "aria-describedby": describedBy })
        : children}
      {error && <div id={id + "-error"} role="alert" className="kf-error">{error}</div>}
    </div>
  );
}

// ---------- layout ----------
function Section({ id, n, title, hint, children }) {
  return (
    <section id={id} className="kf-section" aria-labelledby={id + "-h"}>
      <header className="kf-section-head">
        <span className="kf-section-num" aria-hidden="true">{n}</span>
        <div>
          <h2 id={id + "-h"} className="kf-section-title">{title}</h2>
          {hint && <p className="kf-section-hint">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Band({ brand, title, meta, lede, notes = [], compact }) {
  return (
    <header className="kf-band" data-compact={compact || undefined}>
      <div className="kf-band-inner">
        {brand && <div className="kf-band-brand">{brand}</div>}
        <h1 className="kf-band-title">{title}</h1>
        {meta && <div className="kf-band-meta">{meta}</div>}
        {lede && <p className="kf-band-lede">{lede}</p>}
        {notes.length > 0 && (
          <ul className="kf-band-notes">
            {notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        )}
      </div>
    </header>
  );
}

function Shell({ tokens, children }) {
  return (
    <main data-khg-form="true" className="kf-page" style={tokens}>
      {children}
      <footer className="kf-footer">The Kollective Hospitality Group</footer>
    </main>
  );
}

function LoadingShell() {
  return (
    <main data-khg-form="true" className="kf-page" style={brandTokens("#2B3A55")} aria-busy="true">
      <header className="kf-band kf-band--loading">
        <div className="kf-band-inner">
          <div className="kf-skel kf-skel--brand" />
          <div className="kf-skel kf-skel--title" />
          <div className="kf-skel kf-skel--line" />
        </div>
      </header>
      <div className="kf-sheet kf-sheet--narrow">
        <span className="kf-visually-hidden">Loading form</span>
        {[0, 1, 2, 3].map((i) => <div key={i} className="kf-skel kf-skel--field" />)}
      </div>
    </main>
  );
}

function humanError(code = "") {
  if (code.includes("FORM_NOT_FOUND") || code.includes("FORM_NOT_AVAILABLE")) return "This form is not currently available.";
  if (code.includes("FORM_CLOSED")) return "This form has closed.";
  if (code.includes("FORM_CAPACITY_REACHED")) return "This form has reached capacity.";
  if (code.includes("RECENT_DUPLICATE")) return "We just received a matching submission. Wait a few minutes before sending again.";
  if (code.includes("FILE_SIZE_INVALID") || code.includes("PAYLOAD_TOO_LARGE")) return "One of the files is over 10 MB. Choose a smaller file.";
  if (code.includes("FILE_TYPE_NOT_ALLOWED")) return "That file type isn't supported. Use PDF, JPG, PNG, WebP or DOCX.";
  if (code.includes("UPLOAD_FAILED")) return "A file didn't upload. Check your connection and send again.";
  if (code.startsWith("MAX_")) return "Too many files were selected.";
  return "Your answers didn't send. Check your connection and try again — nothing you entered was lost.";
}
