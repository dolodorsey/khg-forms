"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

const ENDPOINT = "https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-form-intake";
const CITIES = ["Atlanta", "Houston", "Washington, DC", "Los Angeles", "Charlotte", "Miami", "New York", "Dallas", "Chicago", "New Orleans", "Las Vegas", "Phoenix", "Other"];
const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const normalize = (value = "") => decodeURIComponent(value).replace(/-/g, "_").toLowerCase();
const pretty = (value = "") => value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export default function UniversalFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const brandKey = normalize(params?.brand);
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

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateRole = (key, value) => setForm((prev) => ({ ...prev, role_data: { ...prev.role_data, [key]: value } }));
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
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#151515";

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
      hasSignatureRef.current = true;
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
    if (config?.requires_acknowledgment && !acknowledgmentChecked) errors.acknowledgment = "You must accept the agreement.";
    if (config?.requires_signature_canvas && !hasSignatureRef.current) errors.signature = "Signature required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
      setError("Please complete the required fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        metadata: { renderer: "khg-forms-v2", route: `/f/${brandKey}/${roleType}` },
      };
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "SUBMISSION_FAILED");
      setSubmitted(data?.submission || { submission_ref: data?.submission_ref || "RECEIVED" });
      setStep(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(humanError(e?.message));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Shell><div style={styles.loading}>LOADING FORM…</div></Shell>;
  if (!config) return <Shell><Message title="FORM NOT AVAILABLE" body={error || "This form is unavailable."} /></Shell>;

  const accent = config.brand_color || "#B68A42";
  const customFields = Array.isArray(config.custom_fields) ? config.custom_fields : [];

  if (submitted && postSignup.length > 0) {
    const current = postSignup[Math.min(step, postSignup.length - 1)];
    const last = step >= postSignup.length - 1;
    return (
      <Shell accent={accent}>
        <Header config={config} accent={accent} />
        <div style={styles.card}>
          <div style={{ ...styles.eyebrow, color: accent }}>NEXT STEP {step + 1} OF {postSignup.length}</div>
          <h2 style={styles.cardTitle}>{current?.instruction_title || "NEXT STEP"}</h2>
          <div style={styles.bodyText}>{current?.instruction_body}</div>
          {current?.action_url && <a href={current.action_url} target="_blank" rel="noreferrer" style={{ ...styles.actionLink, background: accent }}>OPEN STEP</a>}
        </div>
        <button style={{ ...styles.button, background: accent }} onClick={() => last ? window.location.assign("/") : setStep((s) => s + 1)}>
          {last ? "DONE" : "CONTINUE"}
        </button>
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell accent={accent}>
        <Header config={config} accent={accent} />
        <div style={{ ...styles.card, textAlign: "center", paddingTop: 38, paddingBottom: 38 }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>✓</div>
          <h1 style={styles.successTitle}>{config.success_title || "SUBMISSION RECEIVED"}</h1>
          <p style={styles.successBody}>{config.success_body || "Your submission has been received. Our team will follow up."}</p>
          {submitted?.submission_ref && <div style={styles.reference}>REFERENCE: {submitted.submission_ref}</div>}
        </div>
      </Shell>
    );
  }

  return (
    <Shell accent={accent}>
      <Header config={config} accent={accent} />
      {error && <div style={styles.errorBanner}>{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <Section title="Contact Information" accent={accent}>
          <div style={styles.twoCol}>
            <CoreInput label="First Name" name="first_name" value={form.first_name} onChange={update} required error={fieldErrors.first_name} />
            <CoreInput label="Last Name" name="last_name" value={form.last_name} onChange={update} required error={fieldErrors.last_name} />
          </div>
          <div style={styles.twoCol}>
            <CoreInput label="Email" name="email" type="email" value={form.email} onChange={update} required error={fieldErrors.email} />
            <CoreInput label="Phone" name="phone" type="tel" value={form.phone} onChange={update} required={(config.required_fields || []).includes("phone")} error={fieldErrors.phone} />
          </div>
          <div style={styles.twoCol}>
            <CoreSelect label="City / Market" name="city" value={form.city} onChange={update} options={CITIES} required={(config.required_fields || []).includes("city")} error={fieldErrors.city} />
            <CoreInput label="Instagram" name="instagram_handle" value={form.instagram_handle} onChange={update} required={(config.required_fields || []).includes("instagram") || (config.required_fields || []).includes("instagram_handle")} error={fieldErrors.instagram || fieldErrors.instagram_handle} />
          </div>
          <div style={styles.twoCol}>
            <CoreInput label="TikTok" name="tiktok_handle" value={form.tiktok_handle} onChange={update} />
            <CoreInput label="Website" name="website_url" type="url" value={form.website_url} onChange={update} />
          </div>
        </Section>

        {config.legal_document_text && (
          <Section title={config.legal_document_title || "Agreement"} accent={accent}>
            <div
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolledToBottom(true);
              }}
              style={styles.legalBox}
            >
              {config.legal_document_text}
            </div>
            {config.requires_acknowledgment && (
              <label style={styles.checkboxRow}>
                <input type="checkbox" checked={acknowledgmentChecked} onChange={(e) => setAcknowledgmentChecked(e.target.checked)} />
                <span>I have read and agree to this agreement.</span>
              </label>
            )}
            {fieldErrors.acknowledgment && <div style={styles.fieldError}>{fieldErrors.acknowledgment}</div>}
            {config.requires_signature_canvas && (
              <div style={{ marginTop: 18 }}>
                <div style={styles.label}>DRAW SIGNATURE *</div>
                <canvas ref={setupCanvas} width={900} height={200} style={{ ...styles.canvas, borderColor: accent }} />
                <button type="button" onClick={clearSignature} style={{ ...styles.textButton, color: accent }}>CLEAR SIGNATURE</button>
                {fieldErrors.signature && <div style={styles.fieldError}>{fieldErrors.signature}</div>}
              </div>
            )}
          </Section>
        )}

        {customFields.length > 0 && (
          <Section title={`${pretty(roleType)} Details`} accent={accent}>
            {customFields.map((field) => (
              <DynamicField
                key={field.key}
                field={field}
                value={form.role_data[field.key]}
                file={files[field.key]}
                onChange={(value) => updateRole(field.key, value)}
                onToggle={(option) => toggleMulti(field.key, option)}
                onFile={(file) => setFiles((prev) => ({ ...prev, [field.key]: file }))}
                error={fieldErrors[field.key]}
                accent={accent}
              />
            ))}
          </Section>
        )}

        {config.include_clothing && (
          <Section title="Sizing" accent={accent}>
            <div style={styles.twoCol}>
              <CoreSelect label="Shirt Size" name="shirt_size" value={form.shirt_size} onChange={update} options={SIZES} />
              <CoreInput label="Shoe Size" name="shoe_size" value={form.shoe_size} onChange={update} />
            </div>
            <div style={styles.twoCol}>
              <CoreInput label="Pants / Waist Size" name="pants_size" value={form.pants_size} onChange={update} />
              <CoreSelect label="Preferred Style" name="preferred_style" value={form.preferred_style} onChange={update} options={["Streetwear", "Casual", "Formal", "Athletic", "Luxury"]} />
            </div>
          </Section>
        )}

        {config.include_shipping && (
          <Section title="Shipping Address" accent={accent}>
            <ShippingField label="Address Line 1" name="line1" value={form.shipping_address.line1} onChange={updateShipping} />
            <ShippingField label="Address Line 2" name="line2" value={form.shipping_address.line2} onChange={updateShipping} />
            <div style={styles.twoCol}>
              <ShippingField label="City" name="city" value={form.shipping_address.city} onChange={updateShipping} />
              <ShippingField label="State" name="state" value={form.shipping_address.state} onChange={updateShipping} />
            </div>
            <ShippingField label="ZIP Code" name="zip" value={form.shipping_address.zip} onChange={updateShipping} />
          </Section>
        )}

        <Section title="Contact Preferences" accent={accent}>
          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={smsConsent} onChange={(e) => setSmsConsent(e.target.checked)} />
            <span>You may text me updates specifically about this submission. Message/data rates may apply.</span>
          </label>
          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} />
            <span>I also want occasional brand news, opportunities, or offers by email.</span>
          </label>
        </Section>

        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label>Company Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
        </div>

        <button type="submit" disabled={submitting} style={{ ...styles.button, background: accent, opacity: submitting ? 0.62 : 1 }}>
          {submitting ? "SUBMITTING…" : (config.submit_label || "SUBMIT")}
        </button>
        <div style={styles.privacy}>Your information is routed only to the team responsible for this brand and submission type.</div>
      </form>
    </Shell>
  );
}

function DynamicField({ field, value, file, onChange, onToggle, onFile, error, accent }) {
  const required = Boolean(field.required);
  const type = field.type || "text";
  const options = Array.isArray(field.options) ? field.options : [];
  if (type === "textarea") return (
    <FieldWrap label={field.label} required={required} error={error}>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder || ""} style={styles.textarea} />
    </FieldWrap>
  );
  if (type === "select") return (
    <FieldWrap label={field.label} required={required} error={error}>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={styles.input}>
        <option value="">Select…</option>
        {options.map((option) => <option value={option} key={option}>{option}</option>)}
      </select>
    </FieldWrap>
  );
  if (type === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <FieldWrap label={field.label} required={required} error={error}>
        <div style={styles.chipWrap}>
          {options.map((option) => {
            const active = selected.includes(option);
            return <button type="button" key={option} onClick={() => onToggle(option)} style={{ ...styles.chip, borderColor: active ? accent : "#D8D4CC", color: active ? accent : "#555", background: active ? `${accent}12` : "#F8F7F4" }}>{option}</button>;
          })}
        </div>
      </FieldWrap>
    );
  }
  if (type === "checkbox") return (
    <div style={styles.field}>
      <label style={styles.checkboxRow}>
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.label}{required ? " *" : ""}</span>
      </label>
      {error && <div style={styles.fieldError}>{error}</div>}
    </div>
  );
  if (type === "file") return (
    <FieldWrap label={field.label} required={required} error={error}>
      <label style={{ ...styles.fileBox, borderColor: file ? accent : "#D8D4CC" }}>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
          style={{ display: "none" }}
        />
        <span>{file ? `✓ ${file.name}` : "Choose PDF, JPG, PNG, WebP or DOCX — max 10 MB"}</span>
      </label>
    </FieldWrap>
  );
  return (
    <FieldWrap label={field.label} required={required} error={error}>
      <input
        type={["email", "tel", "url", "number", "date"].includes(type) ? type : "text"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || ""}
        style={styles.input}
      />
    </FieldWrap>
  );
}

function CoreInput({ label, name, value, onChange, type = "text", required, error }) {
  return <FieldWrap label={label} required={required} error={error}><input type={type} value={value || ""} onChange={(e) => onChange(name, e.target.value)} style={styles.input} /></FieldWrap>;
}
function CoreSelect({ label, name, value, onChange, options, required, error }) {
  return <FieldWrap label={label} required={required} error={error}><select value={value || ""} onChange={(e) => onChange(name, e.target.value)} style={styles.input}><option value="">Select…</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></FieldWrap>;
}
function ShippingField({ label, name, value, onChange }) {
  return <FieldWrap label={label}><input value={value || ""} onChange={(e) => onChange(name, e.target.value)} style={styles.input} /></FieldWrap>;
}
function FieldWrap({ label, required, error, children }) {
  return <div style={styles.field}><label style={styles.label}>{label}{required ? " *" : ""}</label>{children}{error && <div style={styles.fieldError}>{error}</div>}</div>;
}
function Section({ title, accent, children }) {
  return <div style={styles.card}><div style={{ ...styles.eyebrow, color: accent }}>{title}</div>{children}</div>;
}
function Header({ config, accent }) {
  return (
    <div style={styles.header}>
      {config.logo_url && <div style={styles.logoBox}><img src={config.logo_url} alt="" style={styles.logo} /></div>}
      <div style={{ ...styles.brandMark, color: accent }}>{pretty(config.brand_key)}</div>
      <h1 style={styles.title}>{config.form_title || pretty(config.role_type)}</h1>
      {config.form_subtitle && <p style={styles.subtitle}>{config.form_subtitle}</p>}
    </div>
  );
}
function Shell({ children }) {
  return <main style={styles.page}><div style={styles.shell}>{children}<footer style={styles.footer}>THE KOLLECTIVE HOSPITALITY GROUP</footer></div></main>;
}
function Message({ title, body }) {
  return <div style={{ ...styles.card, textAlign: "center", marginTop: 90 }}><h1 style={styles.successTitle}>{title}</h1><p style={styles.successBody}>{body}</p></div>;
}
function humanError(code = "") {
  if (code.includes("FORM_NOT_FOUND") || code.includes("FORM_NOT_AVAILABLE")) return "This form is not currently available.";
  if (code.includes("FORM_CLOSED")) return "This form has closed.";
  if (code.includes("FORM_CAPACITY_REACHED")) return "This form has reached capacity.";
  if (code.includes("RECENT_DUPLICATE")) return "We just received a matching submission. Please wait before submitting again.";
  if (code.includes("FILE_SIZE_INVALID") || code.includes("PAYLOAD_TOO_LARGE")) return "One of the uploaded files is too large.";
  if (code.includes("FILE_TYPE_NOT_ALLOWED")) return "That file type is not supported.";
  if (code.includes("UPLOAD_FAILED")) return "A file could not be uploaded. Please retry.";
  if (code.startsWith("MAX_")) return "Too many files were selected.";
  return "We could not submit the form. Please review the information and try again.";
}

const styles = {
  page: { minHeight: "100vh", background: "#F4F1EA", color: "#171717", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "28px 14px 70px" },
  shell: { width: "100%", maxWidth: 720, margin: "0 auto" },
  loading: { padding: "120px 20px", textAlign: "center", letterSpacing: 3, fontSize: 12, color: "#777" },
  header: { textAlign: "center", padding: "24px 16px 28px" },
  logoBox: { display: "inline-flex", background: "#111", borderRadius: 16, padding: 12, marginBottom: 14 },
  logo: { height: 52, maxWidth: 180, objectFit: "contain", display: "block" },
  brandMark: { fontSize: 10, fontWeight: 800, letterSpacing: 3.2, textTransform: "uppercase", marginBottom: 10 },
  title: { fontSize: "clamp(28px, 6vw, 45px)", lineHeight: 1.02, letterSpacing: -1.5, margin: 0, fontWeight: 900 },
  subtitle: { margin: "14px auto 0", color: "#666", fontSize: 14, lineHeight: 1.65, maxWidth: 560 },
  card: { background: "#FFF", border: "1px solid #E3DED3", borderRadius: 18, padding: "24px 22px", marginBottom: 16, boxShadow: "0 8px 28px rgba(40,30,12,0.045)" },
  eyebrow: { fontSize: 10, fontWeight: 850, letterSpacing: 2.8, textTransform: "uppercase", marginBottom: 18 },
  cardTitle: { fontSize: 24, lineHeight: 1.15, margin: "0 0 14px", fontWeight: 850 },
  bodyText: { fontSize: 14, color: "#4E4E4E", lineHeight: 1.7, whiteSpace: "pre-line" },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 12px" },
  field: { marginBottom: 16 },
  label: { display: "block", marginBottom: 7, fontSize: 10, fontWeight: 800, letterSpacing: 1.7, color: "#666", textTransform: "uppercase" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #D8D4CC", background: "#FCFBF8", color: "#171717", borderRadius: 10, padding: "13px 13px", fontSize: 14, outline: "none", fontFamily: "inherit" },
  textarea: { width: "100%", minHeight: 108, resize: "vertical", boxSizing: "border-box", border: "1px solid #D8D4CC", background: "#FCFBF8", color: "#171717", borderRadius: 10, padding: "13px 13px", fontSize: 14, outline: "none", fontFamily: "inherit", lineHeight: 1.55 },
  fieldError: { marginTop: 5, fontSize: 11, fontWeight: 700, color: "#B42318" },
  errorBanner: { background: "#FFF0EE", border: "1px solid #F5B7AF", color: "#8D2117", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontWeight: 700, marginBottom: 16 },
  chipWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { border: "1px solid", borderRadius: 999, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  checkboxRow: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#414141", lineHeight: 1.55, cursor: "pointer", marginBottom: 12 },
  fileBox: { display: "block", border: "1.5px dashed", background: "#FBFAF7", borderRadius: 11, padding: "16px 14px", fontSize: 12, color: "#555", cursor: "pointer" },
  button: { width: "100%", border: 0, borderRadius: 13, padding: "16px 18px", color: "white", fontSize: 13, fontWeight: 900, letterSpacing: 1.7, textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 22px rgba(0,0,0,0.12)" },
  textButton: { border: 0, background: "transparent", padding: "8px 0", fontSize: 10, fontWeight: 900, letterSpacing: 1.4, cursor: "pointer" },
  actionLink: { display: "inline-block", marginTop: 20, color: "white", textDecoration: "none", borderRadius: 10, padding: "12px 16px", fontSize: 11, fontWeight: 900, letterSpacing: 1.4 },
  privacy: { textAlign: "center", color: "#777", fontSize: 10, lineHeight: 1.5, padding: "12px 18px 0" },
  footer: { textAlign: "center", color: "#948D80", fontSize: 9, letterSpacing: 3, fontWeight: 800, padding: "34px 0 0" },
  legalBox: { maxHeight: 350, overflowY: "auto", whiteSpace: "pre-wrap", padding: 16, border: "1px solid #DEDAD1", borderRadius: 10, background: "#FBFAF7", fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.65, color: "#333", marginBottom: 16 },
  canvas: { width: "100%", height: 150, background: "#FFF", border: "1.5px dashed", borderRadius: 10, touchAction: "none" },
  successTitle: { fontSize: 28, lineHeight: 1.08, margin: "0 0 12px", fontWeight: 900 },
  successBody: { maxWidth: 520, margin: "0 auto", color: "#666", lineHeight: 1.7, fontSize: 14 },
  reference: { display: "inline-block", marginTop: 22, padding: "8px 12px", borderRadius: 8, background: "#F4F1EA", fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: "#575044" },
};
